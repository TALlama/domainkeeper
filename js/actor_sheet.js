import {RxElement} from "./rx_element.js";

export class ActorSheet extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get actor() { return this.domainSheet.currentActor }

  render() {
    if (!this.actor) { return this.renderNoActor() }

    return `${this.renderHeader()}${this.renderBody()}`;
  }

  renderNoActor() {
    return `<h3>
      All activities for the turn have been taken.
      <span class='badge'>0 activities left</span>
    </h3>`
  }

  renderHeader() {
    let activitx = (count) => count == 1 ? "1 activity" : `${count} activities`;

    return `
      <h3>
        ${this.actor.name} is up!
        <span class='badge'>
          ${activitx(this.actor.activitiesLeft)} left
          <a href="#" data-action="doAddBonusActivity">+</a>
          <a href="#" data-action="doAddBonusActivity" data-amount="-1">-</a>
        </span>
      </h3>
    `;
  }

  renderBody() {
    return `<article>
      <ul class="powerups list-unstyled list-inline">${this.actor.powerups.map(powerup => `<li>${powerup.name}</li>`)}</ul>
    </article>`
  }

  //////////////////////////////////// Event handling

  doAddBonusActivity(event) {
    this.actor.bonusActivities += Number(event.target.closest("[data-amount]")?.dataset?.amount ?? 1);
  }
}
ActorSheet.define("actor-sheet");
