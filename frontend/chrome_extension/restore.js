(function(state) {
  if (!state) return;

  // restores scroll position based on saved state
  if (typeof state.scrollX === 'number' && typeof state.scrollY === 'number') {
    window.scrollTo(state.scrollX, state.scrollY);
  }

  // restores form controls if controls for the given form
  // were saved to begin with
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
