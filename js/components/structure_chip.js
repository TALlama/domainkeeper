import { displayBonus } from "../helpers.js";

import { Structure } from "../models/structure.js";

import { nudge } from "./event_helpers.js";
import { RxElement } from "./rx_element.js";
import { TraitList } from "./trait_list.js";

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

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      ${this.structure.name}
      <a href="#" data-action="showDetails">ℹ️</a>
      ${this.renderDialog()}`;
  }

  renderDialog(structure = this.structure) {
    return `<sl-dialog label="${structure.name}" class="structure-details">
      <structure-description structure-id="${structure.id}"></structure-description>

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
      nudge(this, (activity) => activity.error(`💥 Structure destroyed: ${this.structure.name}`));
      this.hideDetails(event);
      this.actor.removePowerup(this.structure);
    }
  }
}
StructureChip.define("structure-chip");
