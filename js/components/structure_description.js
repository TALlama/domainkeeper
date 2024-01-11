import { Structure } from "../models/structure.js";

import { RxElement } from "./rx_element.js";

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
  get actor() {
    let structureId = this.structure.id;
    return this.domainSheet.actors.find(a => a.powerup(structureId));
  }

  render() {
    return `
      <span class="name">${this.structure.name}</span>
      <ul class="traits list-unstyled list-inline">${(this.structure.traits || []).map(t => `<li><span class='badge'>${t}</span></li>`).join("")}</ul>
      <span class="level">Lvl ${this.structure.level}</span>
      <div class="structure">${this.structure.description || ""}</div>
      <ul class="bonuses list-unstyled">${(this.structure.bonuses || []).map(b => `<li><span class='bonus'>${JSON.stringify(b)}</span></li>`).join("")}</ul>
      <div class="effects">${this.structure.effects || ""}</div>`;
  }
}
StructureDescription.define("structure-description");
