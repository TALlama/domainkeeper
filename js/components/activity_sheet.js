import {callOrReturn, errorMessage, mod} from "../helpers.js";

import {Activity} from "../models/activity.js";

import {RxElement} from "./rx_element.js";
import {DifficultyClass} from "./difficulty_class.js";
import {AbilityRoll} from "./ability_roll.js";

import { debugJSON } from "../helpers.js";

export class ActivitySheet extends RxElement {
  connectedCallback() {
    let activityId = this.getAttribute("activity-id");
    let initWith = activityId || this.getAttribute("name") || JSON.parse(this.getAttribute("properties") || "{}");

    this.activity = activityId
      ? this.domainSheet.activity(activityId)
      : reef.signal(new Activity(initWith));

    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get actor() { return this.domainSheet.actor(this.activity.actorId) }

  get inCurrentTurn() { return this.currentTurn?.entries?.find(e => e.id === this.id) }
  get canCancel() { return this.actor && this.inCurrentTurn && this.mutableDecisionsCount == (this.activity.decisions || []).length }
  get mutableDecisionsCount() { return (this.activity.decisions || []).count(d => d.mutable) }

  /////////////////////////////////////////////// Actions

  cancelActivity() {
    let entries = this.currentTurn.entries;
    let ixThis = entries.findIndex(e => e.id == this.activity.id);
    ixThis > -1 && entries.splice(ixThis, 1);
  }

  /////////////////////////////////////////////// Rendering

  render() {
    this.setAttributeBoolean("resolved", this.activity.resolved);
    this.setAttribute("name", this.activity.name);
    this.setAttribute("data-type", this.activity.type); // TODO make this just "type"
    this.setAttribute("data-outcome", this.activity.outcome); // TODO make this just "outcome"

    return `
      <header>
        ${this.activity.name}
        <small class="byline">${this.actor ? `by ${this.actor.name}` : ""}</small>
        ${debugJSON(this.activity.id)}
        ${this.renderCancelLink()}
      </header>
      <span class="icon">${this.activity.icon}</span>
      <blockquote class="summary">${this.activity.summary}</blockquote>
      <section class="body">
        <blockquote class="description">${callOrReturn(this.activity.description || "", this)}</blockquote>
        ${this.renderDecisions()}
        <section class="log">
          <header>Log</header>
          <ol class="log-entries list-unstyled">${this.renderLog()}</ol>
        </section>
      </section>`;
  }

  renderCancelLink() {
    return this.canCancel
      ? `<a href="#" class="cancel-activity" data-action="cancelActivity">Cancel</a>`
      : ``;
  }

  renderDecisions() {
    return this.activity.decisions.map(decision =>
      `<activity-decision-panel name="${decision.name}"></activity-decision-panel>`
    ).join("");
  }

  renderLog() {
    return this.activity.log.map(entry =>
      `<li class="log-entry ${entry.level}">${entry.html}</li>`
    ).join("");
  }
}
ActivitySheet.define("activity-sheet");

export class ActivityDecisionPanel extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get activitySheet() { return this.closest("activity-sheet") }
  get domainSheet() { return this.activitySheet?.domainSheet }

  get activity() { return this.activitySheet?.activity }
  get decision() { return this.activity.decision(this.getAttribute("name")) }

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
    return `<span class="picked">${decision.displayValue(decision.resolutionValue)}</span>`;
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
        ${decision.options.map(option => {
          let value = decision.saveValue(option);
          let name = `${activity.id}__${decision.name}`;
          let id = `${name}__${value}`;

          return `<label class='btn pickable' for="${id}">
            <input type=radio id="${id}" name="${name}" value="${value}" class="sr-only" @checked=false data-action="doPick" />
            ${decision.displayValue(option)}
            ${this.renderSummary(activity, decision, option)}
          </label>`
        }).join("")}
      </fieldset>`;
  }

  renderSummary(activity, decision, option) {
    let summary = decision.summaryValue(option);
    return summary ? `<small class="metadata">${summary}</small>` : ``;
  }

  doPick(event) {
    this.decision.resolution = event.target.value;
  }

  undoPick(event) {
    this.decision.resolution = null;
  }
}
ActivityDecisionPanel.define("activity-decision-panel");

/*
  // TODO move this to Activity
  get currentTurn() { return this.domainSheet.data.turns.last() }
  get peerActivities() { return this.currentTurn.entries.filter(e => e.name === this.name) || [] }
  get peerActivityAbilityUsers() { return this.peerActivities.toDictionary(a => [a.usedAbility, this.domainSheet.actor(a.actorId)]) }

      {class: this.peerActivityAbilityUsers[ability] ? "looks-disabled" : ""},
*/
