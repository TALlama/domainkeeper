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

  renderNoActor() {
    return `<h3>
      All activities for the turn have been taken.
      <span class='badge'>0 activities left</span>
    </h3>`
  }

  //////////////////////////////////// Event handling

  doAddBonusActivity(event) {
    this.addBonusActivity(Number(event.target.closest("[data-amount]")?.dataset?.amount ?? 1));
  }

  //////////////////////////////////// Data handling

  addBonusActivity(count = 1) {
    this.currentTurn.bonusActivities ??= {};
    this.currentTurn.bonusActivities[this.actor.id] ??= 0;
    this.currentTurn.bonusActivities[this.actor.id] += count;
  }
}
ActorSheet.define("actor-sheet");
