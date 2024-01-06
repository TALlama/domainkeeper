import {RxElement} from "./rx_element.js";
import {Structure} from "./structure.js";
import {StructureChip} from "./structure_chip.js";

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
    if (!this.actor.isSettlement) { return `` }

    return `<article>
      <ul class="powerups list-unstyled list-inline">${this.actor.powerups.map(powerup => `<li>${this.renderPowerup(powerup)}</li>`).join("")}</ul>
      ${this.renderStructureControls()}
    </article>`
  }

  renderPowerup(powerup) {
    return `<structure-chip structure-id="${powerup.id}"></structure-chip>`;
  }

  renderStructureControls() {
    if (!this.actor.isSettlement) { return `` }

    return `<fieldset class="structure-controls">
      Structure: <input name="name" list="available-structures"/>
      <button data-action="doAddStructure">Build</button>
    </fieldset>`;
  }

  //////////////////////////////////// Event handling

  doAddBonusActivity(event) {
    this.actor.bonusActivities += Number(event.target.closest("[data-amount]")?.dataset?.amount ?? 1);
  }

  doAddStructure(event) {
    let form = event.target.closest('.structure-controls');
    let nameInput = form?.querySelector(`input[name="name"]`);
    let structureName = nameInput?.value;
    if (structureName) {
      // TODO log this
      this.actor.powerups.push(new Structure(structureName));
      nameInput.value = "";
    }
  }
}
ActorSheet.define("actor-sheet");
