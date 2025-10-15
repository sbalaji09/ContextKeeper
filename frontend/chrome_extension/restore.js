// This script restores the page state (scroll position and form values)
// It receives the captured state as a parameter

(function(state) {
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
})
