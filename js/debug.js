document.addEventListener("click", (event) => {
  if (event.altKey && event.metaKey) {
    let el = event.target.closest("body");
    let current = el.style.getPropertyValue("--debug-display");
    el.style.setProperty("--debug-display", current === "block" ? "none" : "block");
  }
});
