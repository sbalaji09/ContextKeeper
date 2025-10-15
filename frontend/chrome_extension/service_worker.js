// service_worker.js

async function captureAllTabs() {
    // Get all windows with their tabs
    const windows = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });
  
    const snapshots = [];
  
    for (const win of windows) {
      const winInfo = {
        windowId: win.id,
        focused: win.focused,
        // Position/size can be null on some platforms; handle defensively
        bounds: { left: win.left, top: win.top, width: win.width, height: win.height },
        tabs: []
      };
  
      for (const tab of (win.tabs || [])) {
        if (!tab.id || !tab.url || tab.url.startsWith("chrome://")) continue;
  
        // Inject capture script; returns an array of results (one per frame execution)
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: false },
          files: ["capture.js"]
        }).catch(() => [undefined]);
  
        const payload = result?.result || null;
  
        winInfo.tabs.push({
          tabId: tab.id,
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl,
          ...payload // { scrollY, scrollX, forms }
        });
      }
  
      snapshots.push(winInfo);
    }
  
    // Persist snapshot with a timestamp
    const key = `snapshot:${Date.now()}`;
    await chrome.storage.local.set({ [key]: snapshots });
  
    // For convenience, keep a "latest" pointer
    await chrome.storage.local.set({ latestSnapshotKey: key });
  
    console.log("Captured snapshot:", key, snapshots);
    return { key, snapshots };
  }
  
  // Toolbar button triggers a capture
  chrome.action.onClicked.addListener(async () => {
    try {
      await captureAllTabs();
    } catch (e) {
      console.error("Capture failed:", e);
    }
  });
  
  // Optional: expose restore via message
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      if (msg?.type === "RESTORE_LATEST") {
        const { latestSnapshotKey } = await chrome.storage.local.get("latestSnapshotKey");
        if (!latestSnapshotKey) return sendResponse({ ok: false, error: "No snapshot" });
        const data = await chrome.storage.local.get(latestSnapshotKey);
        sendResponse({ ok: true, key: latestSnapshotKey, snapshots: data[latestSnapshotKey] });
      }
    })();
    return true; // keep the message channel open for async sendResponse
  });
  