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
  const timestamp = Date.now();
  const key = `snapshot:${timestamp}`;
  await chrome.storage.local.set({ [key]: { snapshots, createdAt: timestamp } });
  await chrome.storage.local.set({ latestSnapshotKey: key });

  console.log("Captured snapshot:", key, snapshots);
  return { key, snapshots };
}

async function listSnapshots() {
  const allData = await chrome.storage.local.get(null);
  const snapshots = [];

  for (const [key, value] of Object.entries(allData)) {
    if (key.startsWith("snapshot:")) {
      const size = JSON.stringify(value).length;
      snapshots.push({
        key,
        createdAt: value.createdAt || parseInt(key.replace("snapshot:", ""), 10),
        size
      });
    }
  }

  // Sort by creation time (newest first)
  snapshots.sort((a, b) => b.createdAt - a.createdAt);
  return snapshots;
}

async function restoreSnapshot(key) {
  // Get the snapshot data
  const data = await chrome.storage.local.get(key);
  const snapshotData = data[key];

  if (!snapshotData || !snapshotData.snapshots) {
    throw new Error("Snapshot not found");
  }

  const windows = snapshotData.snapshots;

  // Restore each window
  for (const winInfo of windows) {
    const createData = {
      focused: winInfo.focused,
      url: winInfo.tabs.map(t => t.url),
      left: winInfo.bounds?.left,
      top: winInfo.bounds?.top,
      width: winInfo.bounds?.width,
      height: winInfo.bounds?.height
    };

    const newWindow = await chrome.windows.create(createData);

    // Wait a bit for tabs to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Restore scroll and form state for each tab
    for (let i = 0; i < winInfo.tabs.length; i++) {
      const tabInfo = winInfo.tabs[i];
      const newTab = newWindow.tabs[i];

      if (!newTab || !tabInfo.scrollX && !tabInfo.scrollY && !tabInfo.forms) {
        continue;
      }

      try {
        // Wait for tab to be ready
        await chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === newTab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });

        // Inject and execute restore script with the captured state
        await chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          func: (state) => {
            if (!state) return;

            // Restore scroll position
            if (typeof state.scrollX === 'number' && typeof state.scrollY === 'number') {
              window.scrollTo(state.scrollX, state.scrollY);
            }

            // Restore form controls
            if (Array.isArray(state.forms)) {
              for (const control of state.forms) {
                if (!control.selector) continue;

                try {
                  const el = document.querySelector(control.selector);
                  if (!el) continue;

                  // Restore based on element type
                  if (control.tag === 'input' && (control.type === 'checkbox' || control.type === 'radio')) {
                    if (typeof control.checked === 'boolean') {
                      el.checked = control.checked;
                    }
                  } else if (control.tag === 'select') {
                    if (typeof control.selectedIndex === 'number') {
                      el.selectedIndex = control.selectedIndex;
                    }
                  } else if (control.contentEditable && control.value) {
                    el.innerText = control.value;
                  } else if (control.value !== null && control.value !== undefined) {
                    el.value = control.value;
                  }
                } catch (err) {
                  console.warn('Failed to restore control:', control.selector, err);
                }
              }
            }
          },
          args: [tabInfo]
        });
      } catch (err) {
        console.warn(`Failed to restore state for tab ${newTab.id}:`, err);
      }
    }
  }
}

async function deleteSnapshot(key) {
  await chrome.storage.local.remove(key);

  // If we deleted the latest, update the pointer
  const { latestSnapshotKey } = await chrome.storage.local.get("latestSnapshotKey");
  if (latestSnapshotKey === key) {
    const remaining = await listSnapshots();
    if (remaining.length > 0) {
      await chrome.storage.local.set({ latestSnapshotKey: remaining[0].key });
    } else {
      await chrome.storage.local.remove("latestSnapshotKey");
    }
  }
}

async function syncSnapshot(key) {
  const { API_URL } = await chrome.storage.local.get("API_URL");
  if (!API_URL) {
    throw new Error("API URL not configured");
  }

  const data = await chrome.storage.local.get(key);
  const snapshotData = data[key];

  if (!snapshotData) {
    throw new Error("Snapshot not found");
  }

  const { API_TOKEN } = await chrome.storage.local.get("API_TOKEN");
  const headers = {
    "Content-Type": "application/json"
  };

  if (API_TOKEN) {
    headers["Authorization"] = `Bearer ${API_TOKEN}`;
  }

  const response = await fetch(`${API_URL}/snapshots`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      key,
      createdAt: snapshotData.createdAt,
      snapshots: snapshotData.snapshots
    })
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

// Message handler for all popup actions
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg?.type) {
        case "CAPTURE_NOW": {
          const result = await captureAllTabs();
          sendResponse({ ok: true, ...result });
          break;
        }

        case "LIST_SNAPSHOTS": {
          const snapshots = await listSnapshots();
          sendResponse({ ok: true, snapshots });
          break;
        }

        case "RESTORE_LATEST": {
          const { latestSnapshotKey } = await chrome.storage.local.get("latestSnapshotKey");
          if (!latestSnapshotKey) {
            sendResponse({ ok: false, error: "No snapshot found" });
            break;
          }
          await restoreSnapshot(latestSnapshotKey);
          sendResponse({ ok: true });
          break;
        }

        case "DELETE_SNAPSHOT": {
          await deleteSnapshot(msg.key);
          sendResponse({ ok: true });
          break;
        }

        case "SYNC_SNAPSHOT": {
          const result = await syncSnapshot(msg.key);
          sendResponse({ ok: true, result });
          break;
        }

        case "SET_API": {
          await chrome.storage.local.set({
            API_URL: msg.API_URL,
            API_TOKEN: msg.API_TOKEN
          });
          sendResponse({ ok: true });
          break;
        }

        default:
          sendResponse({ ok: false, error: "Unknown message type" });
      }
    } catch (err) {
      console.error("Message handler error:", err);
      sendResponse({ ok: false, error: err.message });
    }
  })();

  return true; // Keep the message channel open for async response
});
