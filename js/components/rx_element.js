import { fire } from "./event_helpers.js";

export class RxElement extends HTMLElement {
  $ = this.querySelector;
  $$ = this.querySelectorAll;

  handleEvent(event) {
    let actionTarget = event.target.closest("[data-action]");
    if (actionTarget) {
      event.preventDefault();
      let handler = this[actionTarget.dataset.action];
      handler?.call(this, event, {actionTarget});
    }
  }

  fire(...args) { fire(this, ...args) }

  setAttributeBoolean(name, options = {}) {
    let value = options.value ?? "";
    let present = value || (options.if ?? this[name]);
    present ? this.setAttribute(name, value) : this.removeAttribute(name);
    return present;
  }

  get url() { return this._url ?? new URL(document.location) }
  get searchParams() { return this.url.searchParams }

  static define(tagName) {
    customElements.define(tagName, this);
  }
}
