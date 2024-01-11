import { mod } from "../helpers.js";
import { RxElement } from "./rx_element.js";

export class AbilityRoll extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }

  get difficultyClass() { return this.closest("*:has(difficulty-class").querySelector("difficulty-class").total }
  get activityName() { return this.closest("activity-sheet").activity.name }

  get modifier() { return this.abilityBonus + this.itemBonus }

  get ability() { return this.getAttribute("ability") }
  get abilityBonus() { return this.domainSheet.data[this.ability.toLocaleLowerCase()] }

  // TODO pull in bonuses from consumables (are there any?)
  get itemBonus() { return this.bonuses.first()?.value || 0 }
  get bonuses() { return this._bonuses ??= this.domainSheet.findBonuses({activity: this.activityName, ability: this.ability}) }
  get usedBonuses() { return this.bonuses.slice(0, 1) }
  get unusedBonuses() { return this.bonuses.slice(1) }

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      <span class="ability">${this.ability}</span>
      <span class="modifier">${mod(this.modifier)}</span>
      <ol class="modifier-breakdown list-unstyled">
        ${this.renderBonus({value: this.abilityBonus, structure: {name: "Ability"}})}
        ${this.usedBonuses.map(b => this.renderBonus(b)).join("")}
        ${this.unusedBonuses.map(b => this.renderBonus(b, {used: false})).join("")}
      </ol>
    `;
  }

  renderBonus(bonus, {used}={}) {
    let string = `<span class='metadata'>${bonus.structure.name}</span><span class="modifier-contribution">${mod(bonus.value)}</span>`;
    string = used === false ? `<del>${string}</del>` : string;
    return `<li>${string}</li>`;
  }

  /////////////////////////////////////////////// Event Handling
  
  handleEvent(event) { this.roll() }

  roll() {
    this.domainSheet.roll({modifier: this.ability, itemBonus: this.itemBonus, dc: this.difficultyClass});
  }
}
AbilityRoll.define("ability-roll");
