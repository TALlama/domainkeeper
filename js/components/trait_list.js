import { RxElement } from "./rx_element.js";

export class TraitList extends RxElement {
  connectedCallback() {
    this.addTooltips();
  }

  addTooltips() {
    this.$$("li.trait .badge").forEach(badge => {
      setTimeout(() => {
        let text = TraitList.tooltipFor(badge.textContent);
        if (text) {
          let tooltip = Maker.tag("sl-tooltip", {content: text});
          badge.replaceWith(tooltip);
          tooltip.append(badge);
        }
      }, 0);
    });
  }

  static tooltipFor(trait) {
    return {
      Building: "A collection of indoor sites",
      Yard: "Primarily an outdoor site",
      Infrastructure: "Benefits a whole settlement without occupying space",
      Ediface: "Grants its benefits to a settlement only once; if you build that structure an additional time in the same settlement, it’s purely cosmetic.",
      Famous: "When built, adds one Fame to the Domain",

      Culture: "Affects the Culture ability",
      Economy: "Affects the Economy ability",
      Loyalty: "Affects the Loyalty ability",
      Stability: "Affects the Stability ability",
    }[trait];
  }

  static el(...items) {
    return `<trait-list>
      <ul class="traits list-unstyled list-inline">${items.map(i => `<li class="trait"><span class='badge'>${i}</span></li>`).join("")}</ul>
    </trait-list>`;
  }
}
TraitList.define("trait-list");
