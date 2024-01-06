import {RxElement} from "./rx_element.js";
import {Structure} from "./structure.js";

export class StructureChip extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get structureName() { return this.getAttribute("name") }
  get structure() { return this._structure ??= new Structure(this.structureName) }

  render() {
    return `
      ${this.structureName}
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

      <button slot="footer" data-action="hideDetails">Close</button>
    </sl-dialog>`;
  }

  //////////////////////////////////// Event handling

  showDetails(event) { this.$('sl-dialog').open = true }
  hideDetails(event) { this.$('sl-dialog').open = false }
}
StructureChip.define("structure-chip");
