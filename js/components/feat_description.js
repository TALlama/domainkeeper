import { displayBonus, displayRequirement } from "../helpers.js";

import { Feat } from "../models/feat.js";

import { RxElement } from "./rx_element.js";
import { TraitList } from "./trait_list.js";

export class FeatDescription extends RxElement {
  constructor(feat) {
    super();
    this.feat = feat;
  }

  connectedCallback() {
    let featId = this.getAttribute("feat-id")
    this.feat ??= featId ? this.domainSheet.feat(featId) : new Feat(this.getAttribute("name"))

    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get domain() { return this.domainSheet.domain }

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      <div class="header">
        <span class="name">${this.feat.name}</span>
        ${this.feat.name === this.feat.template ? "" : `<span class="template-name">${this.feat.template}</span>`}
      </div>
      ${TraitList.el(...this.feat.traits)}
      <div class="stats">
        <span class="level">Lvl ${this.feat.level}</span>
      </div>
      <div class="body">
        <ul class="requirement-list list-unstyled">${(this.feat.prerequisites || []).map(req => `<li>${displayRequirement(this.domain, req)}</li>`).join("")}</ul>
        <ul class="bonuses list-unstyled">${(this.feat.bonuses || []).map(b => `<li><span class='bonus'>${displayBonus(b)}</span></li>`).join("")}</ul>
        <div class="description">${this.feat.description || ""}</div>
        <div class="effects">${this.feat.effects || ""}</div>
      </div>`;
  }
}
FeatDescription.define("feat-description");
