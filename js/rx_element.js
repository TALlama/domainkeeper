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

  get url() { return this._url ?? new URL(document.location) }
  get searchParams() { return this.url.searchParams }

  static define(tagName) {
    customElements.define(tagName, this);
  }
}
