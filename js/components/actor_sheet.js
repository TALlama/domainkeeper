import { Structure } from "../models/structure.js";

import { nudge } from "./event_helpers.js";
import { ActivityPicker } from "./activity_picker.js";
import { RxElement } from "./rx_element.js";
import { StructureChip } from "./structure_chip.js";
import { TraitList } from "./trait_list.js";

export class ActorSheet extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get actor() { return this.domainSheet.currentActor }

  /////////////////////////////////////////////// Rendering

  render() {
    if (!this.actor) { return this.renderNoActor() }

    return `${this.renderHeader()}${this.renderBody()}`;
  }

  renderNoActor() {
    return `<h3>Select a leader or settlement on the left.</h3>${this.renderBody()}`
  }

  renderHeader() {
    let activitx = (count) => count == 1 ? "1 activity" : `${count} activities`;

    return `
      <h3>
        ${this.actor.name} is up!
        ${TraitList.el(...this.actor.traits)}
        <span class='badge'>
          ${activitx(this.actor.activitiesLeft)} left
          <a href="#" data-action="doAddBonusActivity">+</a>
          <a href="#" data-action="doAddBonusActivity" data-amount="-1">-</a>
        </span>
        <a href="#" data-action="renameActor" aria-label="Rename ${this.actor.name}">📝</a>
      </h3>
    `;
  }

  renderBody() {
    let content = ``;

    return `<article class="actor-controls">
      ${this.renderPowerups()}
      <activity-picker></activity-picker>
    </article>${this.renderEventButton()}`;
  }

  renderPowerups() {
    return `
      <ul class="powerups list-unstyled list-inline">${(this.actor?.powerups || []).map(powerup => `<li>${this.renderPowerup(powerup)}</li>`).join("")}</ul>
      ${this.renderStructureControls()}`
  }

  renderPowerup(powerup) {
    return `<structure-chip structure-id="${powerup.id}"></structure-chip>`;
  }

  renderStructureControls() {
    if (!this.actor) { return `` }
    if (!this.actor.isSettlement) { return `` }

    return `<fieldset class="structure-controls">
      <label for="nudge-structure">Structure:</label>
      <input id="nudge-structure" name="name" list="available-structures"/>
      <button data-action="doAddStructure">Build</button>
    </fieldset>`;
  }

  renderEventButton() {
    let button = this.domainSheet.readyActors.length
      ? `<button class="add-event add-event-pending" data-action="kickoffEvent">Start event early</button>`
      : `<button class="add-event add-event-ready" data-action="kickoffEvent">Begin event</button>`;
    
    return `<article class="event-controls">${button}</article>`;
  }

  //////////////////////////////////// Event handling

  doAddBonusActivity(event) {
    this.actor.bonusActivities += Number(event.target.closest("[data-amount]")?.dataset?.amount ?? 1);
  }

  renameActor(event) {
    let newName = prompt(`What should we call ${this.actor.name} from now on?`, this.actor.name);
    if (newName) { this.actor.name = newName }
  }

  doAddStructure(event) {
    let form = event.target.closest('.structure-controls');
    let nameInput = form?.querySelector(`input[name="name"]`);
    let structureName = nameInput?.value;
    if (structureName) {
      nudge(this, activity => Structure.add({template: structureName, actor: this.actor, activity,
        added({fullName, actor}) { activity.info(`🏦 Structure added to ${actor.name}: ${fullName}`) },
      }));
      nameInput.value = "";
    }
  }
}
ActorSheet.define("actor-sheet");
