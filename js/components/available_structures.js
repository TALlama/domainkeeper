import { Structure } from "../models/structure.js";

import { RxElement } from "./rx_element.js";

export class AvalableStructures extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get domainLevel() { return this.domainSheet?.domain?.level || 0 }

  get allTemplates() { return Structure.templates }
  get availableTemplates() { return Structure.availableTemplates(this.domainLevel) }
  get names() { return this.templates.map(t => t.name) }

  /////////////////////////////////////////////// Rendering

  render() {
    return [
      this.renderList(this.allTemplates, {id: "all-structures"}),
      this.renderList(this.availableTemplates, {id: "available-structures"}),
    ].join("");
  }

  renderList(templates, {id}) {
    return `
      <datalist id="${id}">
        ${templates.map(t => `<option value="${t.name}">Level ${t.level}: ${t.traits.join(", ")}</option>`).join("")}
      </datalist>`;
  }
}
AvalableStructures.define("available-structures");
