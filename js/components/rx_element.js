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
    let isSet = this.hasAttribute(name) ? this.getAttribute(name) === value.toString() : false;
    let present = value || (options.if ?? this[name]);
    if (present) {
      isSet || this.setAttribute(name, value);
    } else {
      !isSet || this.removeAttribute(name);
    }
    return present;
  }

  get url() { return this._url ?? new URL(document.location) }
  get searchParams() { return this.url.searchParams }

  static define(tagName) {
    customElements.define(tagName, this);
  }
}
