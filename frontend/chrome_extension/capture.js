(function () {
    // added CSS selector that captures all the CSS elements from a specific page
    function getSelector(el) {
      if (!el) return null;
      if (el.id) return `#${CSS.escape(el.id)}`;
      if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name}"]`;
      // fallback: nth-of-type within parent
      const parent = el.parentElement;
      if (!parent) return el.tagName.toLowerCase();
      const tag = el.tagName.toLowerCase();
      const index = Array.from(parent.children).filter(c => c.tagName === el.tagName).indexOf(el) + 1;
      return `${getSelector(parent)} > ${tag}:nth-of-type(${index})`;
    }
  
    // captures a single control's state by capturing different html elements
    function serializeControl(el) {
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute("type") || "").toLowerCase();
  
      // Skip passwords for safety
      if (type === "password") return null;
  
      const base = {
        tag,
        type,
        name: el.name || null,
        id: el.id || null,
        selector: getSelector(el),
        value: null,
        checked: undefined,
        selectedIndex: undefined,
        multiple: undefined,
        options: undefined,
        contentEditable: undefined
      };
  
      if (tag === "textarea" || (tag === "input" && !["checkbox", "radio", "file"].includes(type))) {
        base.value = el.value;
      } else if (tag === "input" && (type === "checkbox" || type === "radio")) {
        base.checked = el.checked;
        base.value = el.value;
      } else if (tag === "select") {
        base.multiple = el.multiple || false;
        base.selectedIndex = el.selectedIndex;
        base.options = Array.from(el.options).map(o => ({ value: o.value, text: o.text, selected: o.selected }));
      }
  
      if (el.isContentEditable) {
        base.contentEditable = true;
        base.value = el.innerHTML; // could also use innerText if you prefer
      }
  
      return base;
    }
    
    // collects all relevant controls on the page
    function collectForms() {
      const controls = Array.from(document.querySelectorAll("input, textarea, select, [contenteditable=''], [contenteditable='true']"));
      const serialized = [];
      for (const el of controls) {
        const item = serializeControl(el);
        if (item) serialized.push(item);
      }
      return serialized;
    }
    
    // builds the final payload for the window
    const payload = {
      scrollX: window.scrollX || document.documentElement.scrollLeft || 0,
      scrollY: window.scrollY || document.documentElement.scrollTop || 0,
      forms: collectForms()
    };
  
    return payload;
  })();
  