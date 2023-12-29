import {RxElement} from "./rx_element.js";
import {Ability} from "./abilities.js";
import {Activity, SystemActivity, LeadershipActivity, CivicActivity} from "./activity/all.js";

export default class DomainActivityLog extends RxElement {
  connectedCallback() {
    this.entries = Maker.tag("main", {class: "entries", appendTo: this});
    this.resetTurn();
    this.turnSummaries = [];

    this.fillStatusBanner();
    this.fillAvailableActivities();
    this.addEventListener("click", this);

    this.initialBoosts();
    this.newTurn();
    this.entry({
      title: "Welcome, Domainkeeper",
      description: "You've got a new domain. Let's see how it goes.",
      body: [
        Maker.tag("p", `💡 Here's a little app to do the math so we can see if this system works. Is it too easy? Too hard? Do these activities make sense? Poke around and play to find out!`),
        Maker.tag("p", `
        👑 Click the buttons above to do activities. You can cancel activities until you've picked any buttons inside them, so feel free to explore.`),
        Maker.tag("p", `♻️ When you're out of activities each turn, click "End turn" to see a summary of what's changed and start the next turn.`),
        Maker.tag("p", `💾 Warning! At the end of every turn, we auto-save domain stats (the sidebar) but not the action history (the main content). So keep that tab open if you care about the details! If you want to start again, click the ❌ at the top of the domain sidebar!`),
        Maker.tag("p", `🎯 Your goal is to keep running and expanding the Kingdom while making sure no Ability drops to 0 and Unrest never gets to 20.`),
      ],
    });

    // For debugging; put `focused: true` in an activity to auto-click it
    let focusedActivity = Activity.all.find(a => a.focused);
    focusedActivity && this.activity(focusedActivity);
  }

  resetTurn() {
    this.domainSheet.data.turns.push({
      leadershipActivities: this.domainSheet.leadershipActivitiesPerTurn,
      civicActivities: this.domainSheet.civicActivitiesPerTurn,
      activities: [],
    });
    this.countRemainingActivities();
  }

  fillStatusBanner() {
    reef.component(this.$(".status-banner"), () => {
      let abilities = this.domainSheet.data;
      if (abilities.culture <= 0) {
        return `The domain has lost its identity and fallen into anarchy.`;
      } else if (abilities.economy <= 0) {
        return `The domain is in financial ruin and has fallen into anarchy.`;
      } else if (abilities.loyalty <= 0) {
        return `The citizens have lost faith in each other, and the domain has fallen into anarchy.`;
      } else if (abilities.stability <= 0) {
        return `The domain cannot patrol its lands and has fallen into anarchy.`;
      } else if (abilities.unrest >= 20) {
        return `The people revolt; the domain has fallen into anarchy.`;
      } else {
        return ``;
      }
    });
  }

  fillAvailableActivities() {
    reef.component(this.$(".activities"), () => {
      let leadershipLeft = this.domainSheet.data.turns.last().leadershipActivitiesLeft;
      let civicLeft = this.domainSheet.data.turns.last().civicActivitiesLeft;
      let activitx = (count) => count == 1 ? "activity" : "activities";

      return `
        <h4>You have ${leadershipLeft} leadership ${activitx(leadershipLeft)} left.</h4>
        <ul class="activities-list leadership-activities">
          ${LeadershipActivity.all.map(activity => activity.button({disabled: leadershipLeft <= 0})).join("")}
        </ul>
        <h4>You have ${civicLeft} civic ${activitx(civicLeft)} left.</h4>
        <ul class="activities-list civic-activities">
          ${CivicActivity.all.map(activity => activity.button({disabled: civicLeft <= 0})).join("")}
        </ul>
        <button class="end-turn ${leadershipLeft + civicLeft > 0 ? "end-turn-pending" : "end-turn-ready"}" data-action="endTurn">End turn</button>`;
    });
  }

  initialBoosts() {
    if (!this.domainSheet.data.abilityBoosts) { return; }

    let activity = new SystemActivity({
      icon: "🌱",
      name: "Initial Boosts",
      description: "Starting stats",
      prompt: [
        Maker.tag("p", `I gave you some random stats, but you can reallocate`),
        Maker.ol(`Start each ability at 2`,
          `one boost`,
          `one boost`,
          `two boosts to different stats`,
          `three boosts to different stats`,
        ),
        Maker.tag("p", `Like in other Pathfinder things, you can't pick the same stat more than once in any given group.`),
        Maker.tag("p", `You should end up with a 6, a 4, a 3,and a 2.`),
        Maker.tag("p", `But maybe that makes things too hard or too easy! We ca adjust this!`),
      ],
      outcome: "",
    });

    this.domainSheet.data.abilityBoosts.forEach((boosts) => {
      activity.log(Maker.tag("hr"));
      activity.boost(...boosts);
    });
    this.domainSheet.data.abilityBoosts = null;

    this.activity(activity);
  }

  endTurn(event) {
    if (event && (this.domainSheet.data.turns.last().leadershipActivitiesLeft > 0 || this.domainSheet.data.turns.last().civicActivitiesLeft > 0)) {
      if (!confirm(`You still have actions left; are you sure you want to waste them and end your turn?`)) {
        return;
      }
    }

    this.entry({
      title: "Event",
      attrs: {class: "event"},
      body: (b) => {
        Maker.tag(b,
          Maker.tag("p", `Presumably some kind of event happens here and stuff happens. Adjust abilties and stats accordingly. Maybe it's one of these:`),
          Maker.tag("section", {class: "pickable-group"},
            Maker.tag("button", "3 Unrest", {class: "pickable", click: () => this.domainSheet.boost("Unrest", "Unrest", "Unrest")}),
            Maker.tag("button", "Lower random ability", {class: "pickable", click: () => this.domainSheet.boost(Ability.random)}),
            Maker.tag("button", "Lose 1 Fame", {class: "pickable", click: () => this.domainSheet.reduce("Fame")}),
            Maker.tag("button", "I did something else", {class: "pickable"}),
            {click: event => event.target.closest(".pickable") ? this.newTurn() : null},
          ),
        );
      },
    });
  }

  newTurn(name) {
    this.domainSheet.saveData();

    let summary = {
      activities: this.domainSheet.data.turns.last().activities,
      abilityScores: this.domainSheet.abilityScores,
      statScores: this.domainSheet.statScores,
    };
    this.turnSummaries.push(summary);
    this.domainSummaryEntry(summary);
    
    this.resetTurn();
    this.turnMarker(name);
    this.ruin();
  }

  doActivity(event, {actionTarget}) {
    let activityName = actionTarget.dataset.activity;
    let activity = Activity.all.find(a => a.name == activityName);
    this.activity(activity);
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get turn() { return this.turnSummaries.length; }

  turnSummary(turn = this.turn) {
    return this.turnSummaries[turn - 1];
  }

  turnMarker(name, title) {
    Maker.tag("article", {class: "turn-marker", prependTo: this.entries, title}, [
      Maker.tag("span", {class: "turn-name"}, name || `Turn ${this.turn}`),
    ]);
  }

  ruin() {
    let activity = new SystemActivity({
      icon: "😢",
      name: "Ruin",
      description: "If Unrest is too high, random stats get reduced",
      prompt: "",
      outcome: "",
    });

    let doRuin = (threshold) => {
      if (activity.domainSheet.data.unrest >= threshold) {
        activity.log(`🤬 Unrest is higher than ${threshold}.`);
        let ability = activity.randomAbility;
        activity.log({
          "Culture": "💸 Corruption is rampant, and no one trusts the domain.",
          "Economy": "🥷🏻 Crime is everywhere, making it hard on honest citizens.",
          "Loyalty": "🧟‍♂️ Decay pervades the domain; only fools would depend on tomorrow.",
          "Stability": "🧟‍♂️ Strife pits neighbors against each other, and everyone is on edge.",
        }[ability]);
        activity.reduce(ability);
      } else {
        activity.log(`😌 Unrest is not ${threshold} or higher.`);
      }
    }

    doRuin(5);
    doRuin(10);
    doRuin(15);

    this.activity(activity);
  }

  withDiffs(newValues, baseline) {
    if (!baseline) { return newValues }

    let retval = {};
    Object.keys(newValues).forEach((ability) => {
      let value = newValues[ability];
      let diff = value - baseline[ability];
      let signClass = diff > 0 ? "diff-positive" : (diff < 0 ? "diff-negative" : "diff-flat");
      retval[ability] = [value, Maker.tag("span", {class: `metadata diff ${signClass}`}, `${diff >= 0 ? "+" : ""}${diff}`)];
    });
    return retval;
  }

  domainSummaryEntry(summary) {
    let lastTurnSummary = this.turnSummary(this.turn - 1);

    this.entry({
      title: "Domain summary",
      description: `Turn ${this.turn}`,
      body: [
        Maker.tag("p", "💾 Domain saved"),
        Maker.tag("h4", "Activities taken"),
        Maker.tag("div", {class: "activities-summary"}, summary.activities.map(activity =>
          Maker.tag("a", activity.icon, {
            href: "#",
            title: activity.name,
            class: `activity-summary`,
            "data-type": activity.dataset.type,
            "data-outcome": activity.dataset.outcome,
            click: () => { setTimeout(() => activity.scrollIntoView(), 1) }})
        )),
        Maker.tag("h4", "Stats at end of turn"),
        Maker.dl(this.withDiffs(summary.abilityScores, lastTurnSummary?.abilityScores), {class: "dl-oneline"}),
        Maker.dl(this.withDiffs(summary.statScores, lastTurnSummary?.statScores), {class: "dl-oneline"}),
      ],
    })
  }

  activity(activity) {
    this.entries.prepend(activity);
    this.domainSheet.data.turns.last().activities.push(activity);
    this.countRemainingActivities();
  }

  countRemainingActivities() {
    let left = {};
    left[LeadershipActivity] = this.domainSheet.leadershipActivitiesPerTurn;
    left[CivicActivity] = this.domainSheet.civicActivitiesPerTurn;
    this.domainSheet.data.turns.last().activities.forEach(activity => {
      left[activity.constructor] -= 1;
    });

    this.domainSheet.data.turns.last().leadershipActivitiesLeft = left[LeadershipActivity];
    this.domainSheet.data.turns.last().civicActivitiesLeft = left[CivicActivity];
  }

  entry({title, description, body, attrs} = {}) {
    Maker.tag("article", {class: "entry", prependTo: this.entries}, attrs, [
      Maker.tag("header", title),
      Maker.tag("blockquote", {class: "description"}, description),
      Maker.tag("section", {class: "body"}, body),
    ]);
  }
}
customElements.define("domain-activity-log", DomainActivityLog);
