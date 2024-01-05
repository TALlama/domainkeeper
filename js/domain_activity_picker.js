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
    let leadershipLeft = this.domainSheet.leadershipActivitiesLeft;
    let civicLeft = this.domainSheet.civicActivitiesLeft;
    let activitx = (count) => count == 1 ? "activity" : "activities";

    return `
      <h3>${this.currentActor ? `${this.currentActor.name} is up!` : `All actions have bee taken for this turn.`}</h3>
      <h4>
        You have ${leadershipLeft} leadership ${activitx(leadershipLeft)} left.
      </h4>
      <ul class="activities-list leadership-activities">
        ${this.buttons(LeadershipActivity.all, leadershipLeft)}
      </ul>
      <h4>
        You have ${civicLeft} civic ${activitx(civicLeft)} left.
      </h4>
      <ul class="activities-list civic-activities">
        ${this.buttons(CivicActivity.all, civicLeft)}
      </ul>
      <button class="end-turn ${leadershipLeft + civicLeft > 0 ? "end-turn-pending" : "end-turn-ready"}" data-action="endTurn">End turn</button>`;
  }
}
DomainActivityPicker.define("domain-activity-picker");
