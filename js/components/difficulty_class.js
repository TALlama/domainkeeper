import { mod } from "../helpers.js";

import { RxElement } from "./rx_element.js";

export class DifficultyClass extends RxElement {
  connectedCallback() {
    this.state = reef.signal({
      other: 0,
      options: JSON.parse(this.getAttribute("options") || `[]`),
    });
    (this.getAttribute("selected") || "").split(";").map(o => o.trim()).forEach(name => name && this.checkOption(name));

    reef.component(this, () => this.render());
    this.addEventListener("change", this);
  }

  get base() { return Number(this.getAttribute("base") || 10) }
  get other() { return this.state.other }
  get total() { return this.base + this.selectedOptions.sum("value") + this.other }
  get options() { return this.state.options }
  get selectedOptions() { return this.options.filter(o => o.checked) }

  handleEvent(event) {
    super.handleEvent(event);

    let optionLabel = event.target.closest("label[data-option-name]");
    if (event.type == "change" && optionLabel) {
      let optionName = optionLabel.dataset.optionName;
      let checkbox = optionLabel.querySelector(`input[type="checkbox"]`);
      checkbox.checked ? this.checkOption(optionName) : this.uncheckOption(optionName);
    }

    let other = event.target.closest(`.other input[type="number"`);
    if (other) { this.state.other = Number(other.value) }
  }

  findOption(optionName) { return this.options.find(option => option.name === optionName) }
  checkOption(optionName) { this.findOption(optionName).checked = true }
  uncheckOption(optionName) { this.findOption(optionName).checked = false }

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      <article class="mods">
      <label class="base btn">Base DC <span class="modifier">${this.base}</span></label>${this.renderOptions()}<span class="other">Mod <input type="number" value="0"/></other>
      </article>
      <output>= DC ${this.total}</output>
    `;
  }

  renderOptions(options = this.options) {
    return options.map(option => this.renderOption(option)).join("");
  }

  renderOption({name, value, checked}) {
    return `<label class="btn" data-option-name="${name}">
      <input type="checkbox" class="sr-only" value="${value}" ${checked ? "checked" : ""} />
      ${name}
      <span class="modifier">${mod(value)}</span>
    </label>`;
  }
}
DifficultyClass.define("difficulty-class");
