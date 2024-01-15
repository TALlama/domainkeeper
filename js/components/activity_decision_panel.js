import { callOrReturn, errorMessage, debugJSON } from "../helpers.js";

import { blockedTooltip } from "./blocked_tooltip.js";
import { AbilityRoll } from "./ability_roll.js";
import { DifficultyClass } from "./difficulty_class.js";
import { RxElement } from "./rx_element.js";

export class ActivityDecisionPanel extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get activitySheet() { return this.closest("activity-sheet") }
  get domainSheet() { return this.activitySheet?.domainSheet }

  get activity() { return this.activitySheet?.activity }
  get decision() { return this.activity.decision(this.getAttribute("name")) }

  /////////////////////////////////////////////// Rendering

  render() {
    let activity = this.activity;
    let decision = this.decision;
    if (!decision) { return `` }

    decision.resolved && this.setAttribute("resolved", "");

    return `
      <header>
        <span class='name'>${decision.name}</span>
        ${decision.resolved ? this.renderResolved(activity, decision) : ``}
        ${this.renderUndoLink()}
      </header>
      ${decision.resolved ? `` : this.renderPending(activity, decision)}`;
  }

  renderResolved(activity, decision) {
    return `<span class="picked">${decision.displayResolutionValue}</span>`;
  }

  renderUndoLink(css="") {
    return this.decision.resolution && this.decision.mutable ? `<a href="#" class="pick-again ${css}" data-action="undoPick"> ⤺ Pick again…</a>` : ``;
  }

  renderPending(activity, decision) {
    if (!decision.options) {
      return errorMessage(`Cannot render pending decision "${decision.name}" in "${activity.name}" [${activity.id}] because it has no options`, decision, activity);
    }

    return `
      <div class="description">${callOrReturn(decision.description || "", this, {decision, activity})}</div>
      <fieldset class='pickable-group'>
        ${Object.entries(decision.groupedOptions).flatMap(([group, options]) => {
          let header = group ? `<header class='option-group'>${group}</header>` : "";
          return [header, ...options.map(option => {
            let value = decision.saveValue(option);
            let name = `${activity.id}__${decision.name}`;
            let id = `${name}__${value}`;
            let whyDisabled = decision.optionDisableReason(option);
            let label = `<label class='btn pickable ${whyDisabled ? "looks-disabled" : ""}' for="${id}">
              <input type=radio id="${id}" name="${name}" value="${value}" class="sr-only" @checked=false data-action="doPick" />
              ${decision.displayValue(option)}
              ${this.renderSummary(activity, decision, option)}
            </label>`;

            return blockedTooltip(whyDisabled, label);
          })];
        }).join("")}
      </fieldset>`;
  }

  renderSummary(activity, decision, option) {
    let summary = decision.summaryValue(option);
    return summary ? `<small class="metadata">${summary}</small>` : ``;
  }

  /////////////////////////////////////////////// Event Handling
  
  doPick(event) {
    this.decision.resolution = event.target.value;
  }

  undoPick(event) {
    this.decision.resolution = null;
  }
}
ActivityDecisionPanel.define("activity-decision-panel");
