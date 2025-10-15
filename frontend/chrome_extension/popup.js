const $ = (sel) => document.querySelector(sel);

async function send(type, payload = {}) {
  return await chrome.runtime.sendMessage({ type, ...payload });
}

async function refreshList() {
  const res = await send("LIST_SNAPSHOTS");
  const list = $("#list");
  list.innerHTML = "";
  if (!res.ok || !Array.isArray(res.snapshots)) {
    list.textContent = res.error || "No snapshots";
    return;
  }
  res.snapshots.forEach(({ key, createdAt, size }) => {
    const div = document.createElement("div");
    div.className = "item";
    const when = createdAt ? new Date(createdAt).toLocaleString() : key;
    div.innerHTML = `
      <div>
        <div><strong>${when}</strong></div>
        <small>${key} • ${Math.round(size/1024)} KB</small>
      </div>
      <div>
        <button data-restore="${key}">Restore</button>
        <button data-sync="${key}">Sync</button>
        <button data-del="${key}">✕</button>
      </div>`;
    list.appendChild(div);
  });

  // Use event delegation - no need to remove/re-add listener
}

document.addEventListener("DOMContentLoaded", async () => {
  $("#capture").addEventListener("click", async () => {
    await send("CAPTURE_NOW");
    await refreshList();
  });

  $("#restore").addEventListener("click", async () => {
    await send("RESTORE_LATEST");
  });

  $("#saveApi").addEventListener("click", async () => {
    const API_URL = $("#apiUrl").value.trim();
    const API_TOKEN = $("#apiToken").value.trim();
    await send("SET_API", { API_URL, API_TOKEN });
    alert("API settings saved!");
  });

  // Event delegation for dynamically created snapshot list buttons
  $("#list").addEventListener("click", async (e) => {
    const r = e.target.getAttribute("data-restore");
    const d = e.target.getAttribute("data-del");
    const s = e.target.getAttribute("data-sync");

    if (r) {
      await send("RESTORE_LATEST");
    } else if (s) {
      const result = await send("SYNC_SNAPSHOT", { key: s });
      if (result.ok) {
        alert("Snapshot synced successfully!");
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } else if (d) {
      await send("DELETE_SNAPSHOT", { key: d });
      await refreshList();
    }
  });

  // Prefill settings
  const { API_URL, API_TOKEN } = await chrome.storage.local.get(["API_URL", "API_TOKEN"]);
  if (API_URL) $("#apiUrl").value = API_URL;
  if (API_TOKEN) $("#apiToken").value = API_TOKEN;

  await refreshList();
});
