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
  get domain() { return this.activity.domain || this.domainSheet.domain }
  get currentTurn() { return this.domain.currentTurn }
  get actor() { return this.domain.actor(this.activity.actorId) }

  get inCurrentTurn() { return this.currentTurn?.activities?.find(e => e.id === this.id) }
  get canCancel() { return this.actor && this.inCurrentTurn && this.mutableDecisionsCount == (this.activity.decisions || []).length }
  get hideDescription() { return this.activity.resolved && this.activity.actorId !== "system" }
  get mutableDecisionsCount() { return (this.activity.decisions || []).count(d => d.mutable) }

  /////////////////////////////////////////////// Rendering

  render() {
    this.setAttributeBoolean("resolved", {if: this.activity.resolved});
    this.setAttribute("name", this.activity.name);
    this.setAttributeBoolean("type", {value: this.activity.type});
    this.activity.decisions.forEach(d => this.setAttributeBoolean(d.saveAs, {value: d.resolution}));

    return `
      <header>
        <span class="activity-name">${this.activity.name}</span>
        <small class="byline">${this.actor ? `by ${this.actor.name}` : ""}</small>
        ${debugJSON(this.activity.id)}
        <span class="activity-actions">
          <a href="#" data-action="rename" class="icon-link" aria-label="Rename">📝</a>
          ${this.renderCancelLink()}
        </span>
      </header>
      <span class="icon">${this.activity.icon}</span>
      ${this.renderSummary()}
      <section class="body">
        ${this.renderDescription()}
        ${this.renderDecisions()}
        <section class="log">
          <header>Log</header>
          <ol class="log-entries list-unstyled">${this.renderLog()}</ol>
        </section>
      </section>`;
  }

  renderCancelLink() {
    return this.canCancel
      ? `<a href="#" class="cancel-activity icon-link" data-action="cancelActivity" aria-label="Cancel">❌</a>`
      : "";
  }

  renderSummary() {
    return `<blockquote class="summary">
      <div class="value">${this.activity.summary}</div>
      <a href="#" class="icon-link" data-action="editSummary" aria-label="Edit summary">📝</a>
    </blockquote>`;
  }

  renderDescription() {
    let desc = callOrReturn(this.activity.description || "", this);
    return this.hideDescription || desc === ""
      ? ""
      : `<blockquote class="description">${desc}</blockquote>`;
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

  rename(event) {
    let value = prompt("What shall we call this activity?", this.activity.name);
    if (value) { this.activity.name = value }
  }

  cancelActivity() {
    this.currentTurn.cancelActivity(this.activity);
  }

  editSummary(event) {
    let value = prompt("What's the real story?", this.activity.summary);
    if (value) { this.activity.summary = value }
  }
}
ActivitySheet.define("activity-sheet");
