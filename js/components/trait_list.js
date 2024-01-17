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
      PC: "A player character, run by a real-world human",
      NPC: "A non-player character, run by the GM",

      Building: "A collection of indoor sites",
      Yard: "Primarily an outdoor site",
      Infrastructure: "Benefits a whole settlement without occupying space",
      Famous: "When built, adds one Fame to the Domain",
      "Limit 1": "You can only build one of these per settlement",
      "Limit 2": "You can only build two of these per settlement",
      "Limit 3": "You can only build three of these per settlement",
      "Limit 4": "You can only build four of these per settlement",

      Culture: "Affects the Culture ability",
      Economy: "Affects the Economy ability",
      Loyalty: "Affects the Loyalty ability",
      Stability: "Affects the Stability ability",
    }[trait];
  }

  static el(...items) {
    return `<trait-list>
      <ul class="traits list-unstyled list-inline">${items.map(i => `<li key=${i} class="trait"><span class='badge'>${i}</span></li>`).join("")}</ul>
    </trait-list>`;
  }
}
TraitList.define("trait-list");
