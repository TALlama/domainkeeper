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
    return `<h3>
      All activities for the turn have been taken.
      <span class='badge'>0 activities left</span>
    </h3>${this.renderBody()}`
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
      </h3>
    `;
  }

  renderBody() {
    let content = ``;

    if (this.actor?.isSettlement) {
      content = `
        <ul class="powerups list-unstyled list-inline">${this.actor.powerups.map(powerup => `<li>${this.renderPowerup(powerup)}</li>`).join("")}</ul>
        ${this.renderStructureControls()}`;
    }

    return `<article>
      ${content}
      <activity-picker></activity-picker>
    </article>`;
  }

  renderPowerup(powerup) {
    return `<structure-chip structure-id="${powerup.id}"></structure-chip>`;
  }

  renderStructureControls() {
    if (!this.actor.isSettlement) { return `` }

    return `<fieldset class="structure-controls">
      <label for="nudge-structure">Structure:</label>
      <input id="nudge-structure" name="name" list="available-structures"/>
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
      nudge(this, activity => Structure.add({template: structureName, actor: this.actor, activity,
        added({fullName, actor}) { activity.info(`🏦 Structure added to ${actor.name}: ${fullName}`) },
      }));
      nameInput.value = "";
    }
  }
}
ActorSheet.define("actor-sheet");
