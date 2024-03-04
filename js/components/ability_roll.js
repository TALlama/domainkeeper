import { mod } from "../helpers.js";
import { DomainRoll } from "../models/domain_roll.js";
import { RxElement } from "./rx_element.js";

export class AbilityRoll extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.domainRoll = new DomainRoll({domain: this.domain, ability: this.ability, activity: this.activityName});
    this.addEventListener("click", this);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get domain() { return this.domainSheet.domain }

  get difficultyClass() { return this.closest("*:has(difficulty-class").querySelector("difficulty-class").total }
  get activityName() { return this.closest("activity-sheet").activity.name }

  get modifier() { return this.domainRoll.modifier }

  get ability() { return this.getAttribute("ability") }
  get abilityBonus() { return this.domainRoll.abilityBonus }

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      <span class="ability">${this.ability}</span>
      <span class="modifier">${mod(this.domainRoll.modifier)}</span>
      <ol class="modifier-breakdown list-unstyled">
        ${this.renderBonuses()}
      </ol>
    `;
  }

  renderBonuses() {
    return `
      ${this.domainRoll.bonuses.map(b => this.renderBonus(b)).join("")}
      ${this.domainRoll.unusedBonuses.map(b => this.renderBonus(b, {used: false})).join("")}
    `;
  }

  renderBonus(bonus, {used}={}) {
    let string = `<span class='metadata'>${bonus.source?.name || "?"}</span><span class="modifier-contribution">${mod(bonus.value)}</span>`;
    string = used === false ? `<del>${string}</del>` : string;
    return `<li title="${bonus.type}">${string}</li>`;
  }

  /////////////////////////////////////////////// Event Handling
  
  handleEvent(event) { this.roll() }

  roll() {
    this.domainSheet.roll({
      dc: this.difficultyClass,
      domainRoll: this.domainRoll,
    });
  }
}
AbilityRoll.define("ability-roll");
