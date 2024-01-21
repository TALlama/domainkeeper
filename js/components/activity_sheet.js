import { callOrReturn, debugJSON } from "../helpers.js";

import { Activity } from "../models/activity.js";

import { RxElement } from "./rx_element.js";
import { ActivityDecisionPanel } from "./activity_decision_panel.js";

export class ActivitySheet extends RxElement {
  connectedCallback() {
    let activityId = this.getAttribute("activity-id");
    let initWith = activityId || this.getAttribute("name") || JSON.parse(this.getAttribute("properties") || "{}");

    this.activity = activityId
      ? this.domainSheet.activity(activityId)
      : reef.signal(new Activity(initWith));

    this.component = reef.component(this, () => this.render());
    this.addEventListener("click", this);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get actor() { return this.domainSheet.actor(this.activity.actorId) }

  get inCurrentTurn() { return this.currentTurn?.activities?.find(e => e.id === this.id) }
  get canCancel() { return this.actor && this.inCurrentTurn && this.mutableDecisionsCount == (this.activity.decisions || []).length }
  get mutableDecisionsCount() { return (this.activity.decisions || []).count(d => d.mutable) }

  /////////////////////////////////////////////// Rendering

  render() {
    this.setAttributeBoolean("resolved", {if: this.activity.resolved});
    this.setAttribute("name", this.activity.name);
    this.setAttributeBoolean("type", {value: this.activity.type});
    this.activity.decisions.forEach(d => this.setAttributeBoolean(d.saveAs, {value: d.resolution}));

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
  
  /////////////////////////////////////////////// Event Handling

  cancelActivity() {
    this.currentTurn.cancelActivity(this.activity);
  }
}
ActivitySheet.define("activity-sheet");
