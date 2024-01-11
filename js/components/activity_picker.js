import { blockedTooltip } from "./blocked_tooltip.js";
import { ActivitySheet } from "./activity_sheet.js";
import { RxElement } from "./rx_element.js";

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
  get unresolvedActivity() { return this.currentTurn.entries.find(e => !e.resolved) }
  get open() { return this.unresolvedActivity === undefined }

  render() {
    return this.setAttributeBoolean("open")
      ? this.renderOpen()
      : this.renderClosed();
  }

  renderClosed() {
    this.removeAttribute("open");

    return `
      <span class="todo">⌛ Complete the activity below before picking another activity.</span>
      ${this.renderEndTurnButton()}`;
  }

  renderOpen() {
    this.setAttribute("open", "");

    let type = this.isLeader ? "leadership" : (this.isSettlement ? "civic" : "none");

    return `
      ${this.isLeader
        ? this.renderActivityList(Activity.templates.matches({type}), this.domainSheet.leadershipActivitiesLeft, "leadership")
        : this.isSettlement ? this.renderActivityList(Activity.templates.matches({type}), this.domainSheet.civicActivitiesLeft, "civic") : ""}
      ${this.renderEndTurnButton()}`;
  }

  renderActivityList(activities, left, typeName) {
    return `
      <ul class="activities-list ${typeName}-activities">
        ${this.renderActivityButton(activities, left)}
      </ul>`;
  }

  renderActivityButton(available, leftOfType) {
    return available.map(activity => {
      let whyDisabled = null;
      if (this.previousActivityNames.includes(activity.name)) {
        whyDisabled = `${this.currentActor.name} has already done this activity this turn`;
      } else if (leftOfType <= 0) {
        whyDisabled = `The domain has used all its activites for this turn`;
      }

      let disabled = whyDisabled !== null;
      let button = `<button title="${activity.summary}" data-action="doActivity" data-activity="${activity.name}" ${disabled ? "disabled" : ""}>
          <span class="icon">${activity.icon}</span>
          <span class="name">${activity.name}</span>
        </button>`;
      return blockedTooltip(whyDisabled, button);
    }).join("");
  }

  renderEndTurnButton() {
    return `<button class="end-turn ${this.currentActor ? "end-turn-pending" : "end-turn-ready"}" data-action="endTurn">End turn</button>`;
  }
}
ActivityPicker.define("activity-picker");
