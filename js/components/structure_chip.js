import {Structure} from "../models/structure.js";

import {RxElement} from "./rx_element.js";

export class StructureChip extends RxElement {
  connectedCallback() {
    let structureId = this.getAttribute("structure-id")
    this.structure = structureId ? this.domainSheet.structure(structureId) : new Structure(this.getAttribute("name"))

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
      ${this.structure.name}
      <a href="#" data-action="showDetails">ℹ️</a>
      ${this.renderDialog()}`;
  }

  renderDialog(structure = this.structure) {
    return `<sl-dialog label="${structure.name}" class="structure-details">
      <ul class='traits list-unstyled list-inline' style="background: lightgrey; padding: .5rem; gap: .5rem">
        ${(structure.traits || []).map(t => `<span class="badge">${t}</span>`).join("")}
      </ul>
      <p class="description">${structure.description}</p>
      <ul class="bonuses">${(structure.bonuses || []).map(b => `<li>${b}</li>`).join("")}</ul>
      <hr/>
      <p class="effects">${structure.effects}</p>

      <section slot="footer">
        ${this.renderDestroyButton()}
        <button data-action="hideDetails">Close</button>
      </section>
    </sl-dialog>`;
  }

  renderDestroyButton() {
    return this.getAttribute("structure-id") ? `<button data-action="destroyStructure">Destroy</button>` : ``;
  }

  //////////////////////////////////// Event handling

  showDetails(event) { this.$('sl-dialog').open = true }
  hideDetails(event) { this.$('sl-dialog').open = false }

  destroyStructure(event) {
    if (confirm("Really destroy? There is no undo!")) {
      // TODO log this
      this.hideDetails(event);
      this.actor.removePowerup(this.structure);
    }
  }
}
StructureChip.define("structure-chip");
