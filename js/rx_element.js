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

  static define(tagName) {
    customElements.define(tagName, this);
  }
}
