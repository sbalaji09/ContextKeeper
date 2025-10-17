# Debug Instructions for Chrome Extension

## Step 1: Check if Service Worker is Running

1. Go to `chrome://extensions`
2. Find "Tab Snapshot (scroll + form state)" extension
3. Make sure it's **enabled** (toggle on)
4. Click on **"service worker"** link (it should say "active" or "inactive")
5. This opens DevTools for the service worker
6. You should see in the console:
   ```
   🚀 Service worker loaded!
   ```

If you DON'T see this message, the service worker has an error.

## Step 2: Check Popup Console

1. Click the extension icon to open the popup
2. **Right-click inside the popup** → **Inspect**
3. This opens DevTools for the popup
4. Click the "Capture" button
5. You should see in the popup console:
   ```
   Capture button clicked
   ```

## Step 3: Check Message Flow

After clicking Capture, you should see:

**In Popup Console:**
```
Capture button clicked
Capture result: {ok: true, key: "snapshot:...", ...}
```

**In Service Worker Console:**
```
📨 Received message: CAPTURE_NOW
📸 Starting capture...
Found 1 windows to capture
Captured snapshot: snapshot:1234567890
🗑️ Closing tabs and opening new empty tab...
Planning to close 5 tabs
Creating new tab in focused window 123
Created new tab with ID: 456
Closing 5 tabs (excluding new tab 456)
✅ Tabs closed successfully
✅ Closed 5 tabs and opened new empty tab
```

## Common Issues:

### Issue 1: Service Worker says "inactive"
**Fix:** Click "service worker" link to wake it up, then try again

### Issue 2: "Error: Could not establish connection"
**Fix:**
1. The service worker crashed or isn't running
2. Go to `chrome://extensions`
3. Click the **refresh icon (↻)** on your extension
4. Try again

### Issue 3: No logs appear at all
**Fix:**
1. Check if you're looking at the right console:
   - **Popup logs** → Right-click popup → Inspect
   - **Service Worker logs** → chrome://extensions → "service worker" link
2. Make sure Developer mode is enabled in chrome://extensions

### Issue 4: Tabs don't close but logs show success
**Fix:** This might be a permissions issue
1. Check manifest.json has: `"tabs"` permission
2. Reload the extension
3. Try on regular web pages (not chrome:// URLs)

## Step 4: Manual Test

Open the service worker console and manually run:

```javascript
// Test capture
chrome.runtime.sendMessage({type: "CAPTURE_NOW"}, (response) => {
  console.log("Manual test result:", response);
});
```

You should see the capture happen immediately.

## Step 5: Check Storage

After capturing, check if data was saved:

```javascript
// In service worker console:
chrome.storage.local.get(null, (data) => {
  console.log("All stored data:", data);
});
```

You should see objects with keys like `snapshot:1234567890`.
