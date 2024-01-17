import { displayBonus } from "../helpers.js";

import { Structure } from "../models/structure.js";

import { RxElement } from "./rx_element.js";
import { TraitList } from "./trait_list.js";

export class StructureDescription extends RxElement {
  constructor(structure) {
    super();
    this.structure = structure;
  }

  connectedCallback() {
    let structureId = this.getAttribute("structure-id")
    this.structure ??= structureId ? this.domainSheet.structure(structureId) : new Structure(this.getAttribute("name"))

    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      <div class="header">
        <span class="name">${this.structure.name}</span>
        ${this.structure.name === this.structure.templateName ? "" : `<span class="template-name">${this.structure.templateName}</span>`}
      </div>
      ${TraitList.el(...this.structure.traits || [])}
      <div class="stats">
        <span class="level">Lvl ${this.structure.level}</span>
        <span class="dc">DC ${this.structure.dc}</span>
      </div>
      <div class="body">
        <ul class="bonuses list-unstyled">${(this.structure.bonuses || []).map(b => `<li><span class='bonus'>${displayBonus(b)}</span></li>`).join("")}</ul>
        <div class="description">${this.structure.description || ""}</div>
        <div class="effects">${this.structure.effects || ""}</div>
      </div>`;
  }
}
StructureDescription.define("structure-description");
