export function fire(element, eventName, options = {}) {
  (element || document).dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    cancelable: true,
    ...options,
  }));
};

export function nudge(element, complete) {
  fire(element, "domains:nudge", {detail: {complete}});
}
