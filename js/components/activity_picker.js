import { Activity } from "../models/activity.js";

import { blockedTooltip } from "./blocked_tooltip.js";
import { ActivitySheet } from "./activity_sheet.js";
import { RxElement } from "./rx_element.js";
import { makeId } from "../models/with_id.js";

export class ActivityPicker extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
  }
  
  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get currentActor() { return this.domainSheet.currentActor }
  get isLeader() { return this.currentActor?.isLeader }
  get isSettlement() { return this.currentActor?.isSettlement }
  get previousActivityNames() { return (this.currentActor?.activitesTaken || []).map(a => a.name) }
  get unresolvedActivity() { return this.currentTurn.activities.find(e => !e.resolved) }
  get open() { return this.unresolvedActivity === undefined }

  /////////////////////////////////////////////// Rendering

  render() {
    return this.setAttributeBoolean("open")
      ? this.renderOpen()
      : this.renderClosed();
  }

  renderClosed() {
    return `
      <span class="todo">⌛ Complete the activity below before picking another activity.</span>
      ${this.renderEventButton()}`;
  }

  renderOpen() {
    let type = this.isLeader ? "leadership" : (this.isSettlement ? "civic" : "none");

    return `
      ${this.isLeader
        ? this.renderActivityList(Activity.templates.matches({type}), this.domainSheet.leadershipActivitiesLeft, "leadership")
        : this.isSettlement ? this.renderActivityList(Activity.templates.matches({type}), this.domainSheet.civicActivitiesLeft, "civic") : ""}
      ${this.renderEventButton()}`;
  }

  renderActivityList(activities, left, typeName) {
    return `
      <div class="activities-list ${typeName}-activities">
        ${this.renderActivityButton(activities, left)}
      </div>`;
  }

  renderActivityButton(available, leftOfType) {
    return available.map(activity => {
      let whyDisabled = null;
      if (activity.type === "leadership" && this.previousActivityNames.includes(activity.name)) {
        whyDisabled = `${this.currentActor.name} has already done this activity this turn`;
      } else if (leftOfType <= 0) {
        whyDisabled = `The domain has used all its activites for this turn`;
      } else if (activity.whyDisabled) {
        whyDisabled = activity.whyDisabled(this.domainSheet.domain, this.currentActor);
      }

      let disabled = !!whyDisabled;
      let button = `<button key="${makeId(activity.name)}" title="${activity.summary}" data-action="doActivity" data-activity="${activity.name}" ${disabled ? "disabled" : ""}>
          <span class="icon">${activity.icon}</span>
          <span class="name">${activity.name}</span>
        </button>`;
      return blockedTooltip(whyDisabled, button);
    }).join("");
  }

  renderEventButton() {
    if (this.unresolvedActivity) { return `` }

    return this.domainSheet.allActivitiesLeft
      ? `<button class="add-event add-event-pending" data-action="kickoffEvent">Start event early</button>`
      : `<button class="add-event add-event-ready" data-action="kickoffEvent">Begin event</button>`;
  }
}
ActivityPicker.define("activity-picker");
