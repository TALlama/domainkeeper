import { Structure } from "../models/structure.js";

import { RxElement } from "./rx_element.js";

export class AvalableStructures extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get domainLevel() { return this.domainSheet?.data?.level || 0 }

  get templates() {
    let level = this.domainLevel;
    return Structure.templates.filter(t => t.level <= level);
  }
  get names() { return this.templates.map(t => t.name) }

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      <datalist id="available-structures">
        ${this.templates.map(n => `<option>${n.name}</option>`).join("")}
      </datalist>`;
  }
}
AvalableStructures.define("available-structures");
