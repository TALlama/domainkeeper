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

  get activity() { return this.activitySheet?.activity }
  get decision() { return this.activity ? this.activity.decision(this.getAttribute("name")) : undefined }

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
    return `<span class="picked" data-display-title-value="${decision.displayTitleValue(decision.resolutionValue)}">${decision.displayResolutionValue}</span>`;
  }

  renderUndoLink(css="") {
    return this.decision.resolution && this.decision.mutable ? `<a href="#" class="pick-again ${css}" data-action="undoPick"> ⤺ Pick again…</a>` : ``;
  }

  renderPending(activity, decision) {
    if (!decision.options) {
      return errorMessage(`Cannot render pending decision "${decision.name}" in "${activity.name}" [${activity.id}] because it has no options`, decision, activity);
    }

    return `
      <div class="description">${callOrReturn(decision.description || "", decision, {decision, activity})}</div>
      ${this.renderEditor(activity, decision)}
      <fieldset class='pickable-group'>
        ${decision.options.length === 0 ? "🚫" : ""}
        ${Object.entries(decision.groupedOptions).flatMap(([group, options]) => {
          let header = group ? `<header class='option-group'>${group}</header>` : "";
          return [header, ...options.map(option => {
            let value = decision.saveValue(option);
            let name = `${activity.id}__${decision.name}`;
            let id = `${name}__${value}`;
            let whyDisabled = decision.optionDisableReason(option, {activity, decision});
            let label = `<label class='btn pickable ${whyDisabled ? "looks-disabled" : ""}' for="${id}" data-value="${value}" data-display-title-value="${decision.displayTitleValue(option)}">
              <input type=radio id="${id}" name="${name}" value="${value}" class="sr-only" @checked=false data-action="doPick" />
              ${decision.displayValue(option)}
              ${this.renderSummary(activity, decision, option)}
            </label>`;

            return blockedTooltip(whyDisabled, label);
          })];
        }).join("")}
      </fieldset>`;
  }

  renderEditor(activity, decision) {
    if (!decision.editor) return "";

    return `<div class="editor">${callOrReturn(decision.editor, decision, {decision, activity})}</div>`;
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
    let resolutionWas = this.decision.resolution;
    this.decision.resolution = null;
    this.decision.unpicked?.call(this.activity, resolutionWas, {activity: this.activity, decision: this.decision});
  }
}
ActivityDecisionPanel.define("activity-decision-panel");
