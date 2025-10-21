const $ = (sel) => document.querySelector(sel);

async function send(type, payload = {}) {
  return await chrome.runtime.sendMessage({ type, ...payload });
}

async function refreshList() {
  const res = await send("LIST_SNAPSHOTS");
  const list = $("#list");
  list.innerHTML = "";

  if (!res.ok || !Array.isArray(res.snapshots) || res.snapshots.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">No saved workspaces yet<br/>Click "Capture" to save your tabs</div>
      </div>
    `;
    return;
  }

  res.snapshots.forEach(({ key, createdAt, size }) => {
    const div = document.createElement("div");
    div.className = "snapshot-item";
    const when = createdAt ? new Date(createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Unknown';

    div.innerHTML = `
      <div class="snapshot-info">
        <div class="snapshot-time">${when}</div>
        <div class="snapshot-meta">${Math.round(size/1024)} KB</div>
      </div>
      <div class="snapshot-actions">
        <button class="icon-btn restore" data-restore="${key}" title="Restore">↩️</button>
        <button class="icon-btn delete" data-del="${key}" title="Delete">🗑️</button>
      </div>
    `;
    list.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  $("#capture").addEventListener("click", async () => {
    try {
      console.log("Capture button clicked");
      const button = $("#capture");
      button.disabled = true;
      button.textContent = "Capturing...";

      const result = await send("CAPTURE_NOW");
      console.log("Capture result:", result);

      if (result && result.ok) {
        button.textContent = "Captured!";
        await refreshList();
        setTimeout(() => {
          button.textContent = "Capture";
          button.disabled = false;
        }, 1000);
      } else {
        alert(`Capture failed: ${result?.error || "Unknown error"}`);
        button.textContent = "Capture";
        button.disabled = false;
      }
    } catch (error) {
      console.error("Capture error:", error);
      alert(`Error: ${error.message}`);
      const button = $("#capture");
      button.textContent = "Capture";
      button.disabled = false;
    }
  });

  $("#restore").addEventListener("click", async () => {
    try {
      console.log("Restore button clicked");
      const result = await send("RESTORE_LATEST");
      if (result && result.ok) {
        window.close();
      } else {
        alert(`Restore failed: ${result?.error || "No snapshot found"}`);
      }
    } catch (error) {
      console.error("Restore error:", error);
      alert(`Error: ${error.message}`);
    }
  });

  // Event delegation for dynamically created snapshot list buttons
  $("#list").addEventListener("click", async (e) => {
    const target = e.target.closest('.icon-btn');
    if (!target) return;

    const r = target.getAttribute("data-restore");
    const d = target.getAttribute("data-del");

    if (r) {
      try {
        target.disabled = true;
        target.style.opacity = '0.5';

        const result = await send("RESTORE_SNAPSHOT", { key: r });
        if (result.ok) {
          window.close(); // Close popup after restore
        } else {
          alert(`Restore failed: ${result.error}`);
          target.disabled = false;
          target.style.opacity = '1';
        }
      } catch (error) {
        console.error("Restore error:", error);
        alert(`Error: ${error.message}`);
        target.disabled = false;
        target.style.opacity = '1';
      }
    } else if (d) {
      try {
        target.disabled = true;
        await send("DELETE_SNAPSHOT", { key: d });
        await refreshList();
      } catch (error) {
        console.error("Delete error:", error);
        alert(`Error: ${error.message}`);
        target.disabled = false;
      }
    }
  });

  await refreshList();
});
