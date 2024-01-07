import {RxElement} from "./rx_element.js";
import {ActivitySheet} from "./activity_sheet.js";
import {blockedTooltip} from "./blocked_tooltip.js";

export class DomainActivityPicker extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
  }
  
  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get currentActor() { return this.domainSheet.currentActor }
  get isLeader() { return this.currentActor?.isLeader }
  get isSettlement() { return this.currentActor?.isSettlement }
  get previousActivityNames() { return (this.currentActor?.activitesTaken || []).map(a => a.name) }

  buttons(available, leftOfType) {
    return available.map(activity => {
      let whyDisabled = null;
      if (this.previousActivityNames.includes(activity.name)) {
        whyDisabled = `${this.currentActor.name} has already done this activity this turn`;
      } else if (leftOfType <= 0) {
        whyDisabled = `The domain has used all its activites for this turn`;
      }
      return blockedTooltip(whyDisabled, activity.button({disabled: whyDisabled !== null}));
    }).join("");
  }

  render() {
    return `
      ${this.isLeader
        ? this.renderActivityList(ActivitySheet.leadershipActivities, this.domainSheet.leadershipActivitiesLeft, "leadership")
        : this.isSettlement ? this.renderActivityList(ActivitySheet.civicActivities, this.domainSheet.civicActivitiesLeft, "civic") : ""}
      ${this.renderEndTurnButton()}`;
  }

  renderActivityList(activities, left, typeName) {
    return `
      <ul class="activities-list ${typeName}-activities">
        ${this.buttons(activities, left)}
      </ul>`;
  }

  renderEndTurnButton() {
    return `<button class="end-turn ${this.currentActor ? "end-turn-pending" : "end-turn-ready"}" data-action="endTurn">End turn</button>`;
  }
}
DomainActivityPicker.define("domain-activity-picker");
