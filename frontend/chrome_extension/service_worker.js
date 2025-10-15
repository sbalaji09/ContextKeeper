// service_worker.js

async function captureAllTabs() {
    // get all windows with their tabs
    const windows = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });
  
    const snapshots = [];
  
    for (const win of windows) {
      // captures all the separate windows
      const winInfo = {
        windowId: win.id,
        focused: win.focused,
        bounds: { left: win.left, top: win.top, width: win.width, height: win.height },
        tabs: []
      };

      // iterates through every tab in the window and adds each one to the winInfo array
      for (const tab of (win.tabs || [])) {
        // Skip restricted URLs that can't be scripted
        if (!tab.id || !tab.url ||
            tab.url.startsWith("chrome://") ||
            tab.url.startsWith("chrome-extension://") ||
            tab.url.startsWith("edge://") ||
            tab.url.startsWith("about:")) {
          continue;
        }

        let payload = null;
        try {
          const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: false },
            files: ["capture.js"]
          });
          payload = result?.result || null;
        } catch (err) {
          console.warn(`Failed to capture tab ${tab.id} (${tab.url}):`, err.message);
          // Continue without payload for this tab
        }

        winInfo.tabs.push({
          tabId: tab.id,
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl,
          index: tab.index, // preserve tab order
          pinned: tab.pinned,
          active: tab.active,
          ...(payload || {})
        });
      }
  
      snapshots.push(winInfo);
    }
  
    // add a snapshot to the time at which the chrome extension button is clicked
    const key = `snapshot:${Date.now()}`;
    await chrome.storage.local.set({ [key]: snapshots });
  
    await chrome.storage.local.set({ latestSnapshotKey: key });
  
    console.log("Captured snapshot:", key, snapshots);
    return { key, snapshots };
  }
  
  // added a listener to the toolbar so that all the tabs are captured when the chrome extension is clicked
  chrome.action.onClicked.addListener(async () => {
    try {
      await captureAllTabs();
    } catch (e) {
      console.error("Capture failed:", e);
    }
  });
  
  // can restore the tabs with a certain message
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      if (msg?.type === "RESTORE_LATEST") {
        const { latestSnapshotKey } = await chrome.storage.local.get("latestSnapshotKey");
        if (!latestSnapshotKey) return sendResponse({ ok: false, error: "No snapshot" });
        const data = await chrome.storage.local.get(latestSnapshotKey);
        sendResponse({ ok: true, key: latestSnapshotKey, snapshots: data[latestSnapshotKey] });
      }
    })();
    return true;
  });
  