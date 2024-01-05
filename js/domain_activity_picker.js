import {RxElement} from "./rx_element.js";
import {LeadershipActivity, CivicActivity} from "./activity/all.js";
import {blockedTooltip} from "./blocked_tooltip.js";

export class DomainActivityPicker extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
  }
  
  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get currentActor() { return this.domainSheet.currentActor }
  get isLeader() { return this.domainSheet.data.leaders.find(l => l.id == this.currentActor?.id) }
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
      <h3>${this.currentActor ? `${this.currentActor.name} is up!` : `All actions have been taken for this turn.`}</h3>
      ${this.isLeader
        ? this.renderActivityList(LeadershipActivity.all, this.domainSheet.leadershipActivitiesLeft, "leadership")
        : this.renderActivityList(CivicActivity.all, this.domainSheet.civicActivitiesLeft, "civic")}
      ${this.renderEndTurnButton()}`;
  }

  renderActivityList(activities, left, typeName) {
    let activitx = (count) => count == 1 ? "activity" : "activities";

    return `
      <h4>
        You have ${left} ${typeName} ${activitx(left)} left.
      </h4>
      <ul class="activities-list ${typeName}-activities">
        ${this.buttons(activities, left)}
      </ul>`;
  }

  renderEndTurnButton() {
    return `<button class="end-turn ${this.currentActor ? "end-turn-pending" : "end-turn-ready"}" data-action="endTurn">End turn</button>`;
  }
}
DomainActivityPicker.define("domain-activity-picker");
