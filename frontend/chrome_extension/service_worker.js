console.log("🚀 Service worker loaded!");

// Test that chrome APIs are available
chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extension installed/updated");
});

// captures all the current browser window's tabs and their state
async function captureAllTabs() {
  console.log("📸 Starting capture...");

  // captures only the current window and not any other windows
  const currentWindow = await chrome.windows.getCurrent({ populate: true });
  console.log(`Capturing current window with ${currentWindow.tabs.length} tabs`);

  const windows = [currentWindow];
  const snapshots = [];

  for (const win of windows) {
    const winInfo = {
      windowId: win.id,
      focused: win.focused,
      bounds: { left: win.left, top: win.top, width: win.width, height: win.height },
      tabs: []
    };
    // iterates through every tab in the captured window and runs the capture.js script
    // to collect state on teach individual tab
    for (const tab of (win.tabs || [])) {
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

      // adds each collected tab to the winInfo list
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

  // Sync to backend API (Supabase)
  try {
    await syncToBackend(snapshots);
    console.log("✅ Synced to backend successfully");
  } catch (error) {
    console.error("❌ Failed to sync to backend:", error);
    // Continue anyway - local storage still has the snapshot
  }

  // close all tabs after capturing
  await closeAllTabsAndOpenEmpty(windows);

  return { key, snapshots };
}

// this closes all tabs in the current window and opens a new empty tab
// called when the user captures their current window
// NOTE: Dashboard tabs are preserved and not closed
async function closeAllTabsAndOpenEmpty(windows) {
  try {
    console.log("🗑️ Closing tabs and opening new empty tab...");

    // Dashboard URL patterns to preserve
    const dashboardPatterns = [
      'localhost:3000',
      '/dashboard'
    ];

    // Helper function to check if a URL is the dashboard
    const isDashboardUrl = (url) => {
      if (!url) return false;
      return dashboardPatterns.some(pattern => url.includes(pattern));
    };

    // collect all tab IDs to close from the captured windows (except dashboard)
    const tabIdsToClose = [];
    const dashboardTabIds = [];
    let currentWindowId = null;

    for (const win of windows) {
      currentWindowId = win.id; // This is the current window
      for (const tab of (win.tabs || [])) {
        if (tab.id) {
          // Don't close dashboard tabs
          if (isDashboardUrl(tab.url)) {
            dashboardTabIds.push(tab.id);
            console.log(`📋 Preserving dashboard tab: ${tab.url}`);
          } else {
            tabIdsToClose.push(tab.id);
          }
        }
      }
    }

    console.log(`Planning to close ${tabIdsToClose.length} tabs (preserving ${dashboardTabIds.length} dashboard tabs)`);

    // Create a new empty tab in the CURRENT window (not a new window)
    // Only create if there are no dashboard tabs already open
    let newTab = null;
    if (dashboardTabIds.length === 0) {
      console.log(`Creating new tab in current window ${currentWindowId}`);
      newTab = await chrome.tabs.create({
        windowId: currentWindowId,
        active: true
      });
      console.log(`Created new tab with ID: ${newTab.id}`);
    } else {
      console.log(`Skipping new tab creation - dashboard is already open`);
      // Activate the first dashboard tab instead
      await chrome.tabs.update(dashboardTabIds[0], { active: true });
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // Filter out the new tab ID if one was created
    const tabsToRemove = newTab
      ? tabIdsToClose.filter(id => id !== newTab.id)
      : tabIdsToClose;

    console.log(`Closing ${tabsToRemove.length} tabs (excluding new tab and dashboard)`);

    if (tabsToRemove.length > 0) {
      await chrome.tabs.remove(tabsToRemove);
      console.log("✅ Tabs closed successfully");
    }

    console.log(`✅ Closed ${tabsToRemove.length} tabs, preserved ${dashboardTabIds.length} dashboard tabs`);
  } catch (err) {
    console.error("❌ Error closing tabs:", err);
    throw err;
  }
}

// Syncs captured tabs to backend API (Supabase database)
async function syncToBackend(snapshots) {
  console.log("🔄 Syncing to backend...");

  // Get Supabase session/token
  const { supabaseToken } = await chrome.storage.local.get("supabaseToken");
  if (!supabaseToken) {
    throw new Error("No Supabase token found. Please log in to the dashboard first.");
  }

  // Backend API URL (configurable, defaults to localhost:8080)
  const apiUrl = "http://localhost:8080";

  // Extract tabs from first window
  const winInfo = snapshots[0];
  if (!winInfo || !winInfo.tabs || winInfo.tabs.length === 0) {
    throw new Error("No tabs to sync");
  }

  // Generate workspace name from timestamp
  const workspaceName = `Workspace ${new Date().toLocaleString()}`;

  // Transform tabs to match API format
  const tabs = winInfo.tabs.map((tab, index) => ({
    url: tab.url,
    title: tab.title || null,
    favicon_url: tab.favIconUrl || null,
    position: index
  }));

  // Prepare request payload
  const payload = {
    name: workspaceName,
    description: `Captured on ${new Date().toLocaleString()}`,
    tabs: tabs
  };

  console.log("📤 Sending to backend:", payload);

  // Send to backend
  const response = await fetch(`${apiUrl}/api/workspaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ Backend response:", result);
  return result;
}

// lists all saved workspace snapshots by reading items from chrome.storage.local
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

  // sorts the snapshots by creation time with the newest ones first
  snapshots.sort((a, b) => b.createdAt - a.createdAt);
  return snapshots;
}

// restores a saved snapshot into the current window by loading the snapshot data from storage
async function restoreSnapshot(key, autoDelete = true) {
  console.log(`🔄 Restoring snapshot: ${key}`);

  // Get the snapshot data
  const data = await chrome.storage.local.get(key);
  const snapshotData = data[key];

  if (!snapshotData || !snapshotData.snapshots) {
    throw new Error("Snapshot not found");
  }

  const windows = snapshotData.snapshots;
  console.log(`Restoring ${windows.length} window(s) with ${windows[0]?.tabs?.length || 0} tabs`);

  // Get the current window to restore tabs into
  const currentWindow = await chrome.windows.getCurrent();
  const currentWindowId = currentWindow.id;
  console.log(`Restoring tabs into current window ${currentWindowId}`);

  // Get all tabs to restore from the first window in the snapshot
  const winInfo = windows[0]; // Only restore the first window's tabs
  const urlsToRestore = winInfo.tabs.map(t => t.url).filter(url => url && !url.startsWith("chrome://"));

  if (urlsToRestore.length === 0) {
    throw new Error("No valid URLs to restore");
  }

  console.log(`Adding ${urlsToRestore.length} tabs from snapshot to current window (existing tabs will be preserved)`);

  // Create all the tabs in the current window (preserving existing tabs)
  const newTabs = [];
  for (let i = 0; i < urlsToRestore.length; i++) {
    const url = urlsToRestore[i];
    const tabInfo = winInfo.tabs[i];

    const newTab = await chrome.tabs.create({
      windowId: currentWindowId,
      url: url,
      active: i === 0, // Make first tab active
      pinned: tabInfo.pinned || false
    });

    newTabs.push({ tab: newTab, info: tabInfo });
  }

  // Wait for tabs to load before restoring state
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Restore scroll and form state for each tab
  for (let i = 0; i < newTabs.length; i++) {
    const { tab: newTab, info: tabInfo } = newTabs[i];

    if (!newTab || (!tabInfo.scrollX && !tabInfo.scrollY && !tabInfo.forms)) {
      continue;
    }

    try {
      // Wait for tab to be fully loaded
      await new Promise((resolve) => {
        const listener = (tabId, changeInfo) => {
          if (tabId === newTab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);

        // Timeout after 10 seconds
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 10000);
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

      console.log(`✅ Restored state for tab ${i + 1}/${newTabs.length}`);
    } catch (err) {
      console.warn(`Failed to restore state for tab ${newTab.id}:`, err);
    }
  }

  // Auto-delete the snapshot after restoring (if enabled)
  if (autoDelete) {
    console.log(`🗑️ Auto-deleting snapshot: ${key}`);
    await deleteSnapshot(key);
  }

  console.log("✅ Restore complete!");
}

// deletes a snapshot from storage on the click of delete button
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

// uploads a snapshot to the given backend API url to be displayed on the frontend
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

// handles messages from the popup or other extension parts
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      console.log("📨 Received message:", msg.type);

      // based on the type of message, the listener will call a specific function
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

        case "RESTORE_SNAPSHOT": {
          // Restore a specific snapshot by key
          if (!msg.key) {
            sendResponse({ ok: false, error: "No snapshot key provided" });
            break;
          }
          await restoreSnapshot(msg.key);
          sendResponse({ ok: true });
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
      console.error("❌ Message handler error:", err);
      sendResponse({ ok: false, error: err.message });
    }
  })();

  return true; // Keep the message channel open for async response
});
