import { fire } from "./event_helpers.js";

export class RxElement extends HTMLElement {
  $ = this.querySelector;
  $$ = this.querySelectorAll;

  handleEvent(event) {
    let actionTarget = event.target.closest("[data-action]");
    if (actionTarget) {
      let handler = this[actionTarget.dataset.action];
      handler?.call(this, event, {actionTarget});
    }
  }

  fire(...args) { fire(this, ...args) }

  get url() { return this._url ?? new URL(document.location) }
  get searchParams() { return this.url.searchParams }

  static define(tagName) {
    customElements.define(tagName, this);
  }
}
