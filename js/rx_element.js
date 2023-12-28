export class RxElement extends HTMLElement {
  $ = this.querySelector;
  $$ = this.querySelectorAll;

  handleEvent(event) {
    let actionTarget = event.target.closest("[data-action]");
    if (actionTarget) { this[actionTarget.dataset.action].call(this, event, {actionTarget}) }
  }
}
