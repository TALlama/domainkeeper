import {Ability} from "../models/abilities.js";

import {RxElement} from "./rx_element.js";
import {Activity, SystemActivity} from "./activity.js";
import {PickableGroup} from "./pickable_group.js";
import {DomainActivityPicker} from "./domain_activity_picker.js";

export default class DomainActivityLog extends RxElement {
  connectedCallback() {
    this.entries = Maker.tag("main", {class: "entries", appendTo: this});
    this.turnSummaries = [];

    this.fillStatusBanner();
    this.fillConsumables();
    this.fillCurrentTurnDebug();
    this.addEventListener("click", this);

    if (this.domainSheet.data.turns.length === 0) {
      this.resetTurn();
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
    } else {
      this.reenactHistory();
    }

    // For debugging; put `?activity=Some+Name` in the URL to auto-click it
    let activityFinder = this.searchParams.get("activity");
    let focusedActivity = Activity.all.find(a => a.name === activityFinder);
    focusedActivity && this.activity(focusedActivity);
  }

  resetTurn() {
    delete this.domainSheet.data.currentActorId;
    this.domainSheet.data.leaders.forEach(l => l.rollInitiative());
    this.domainSheet.data.turns.push({
      entries: [],
    });
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

  fillConsumables() {
    reef.component(this.$(".consumables"), () => {
      return Object.values(this.domainSheet.data.consumables).map(consumable => `
        <li class="consumable" ${consumable.action ? `data-action="${consumable.action}"` : ""} data-use-by="${consumable.useBy ?? "end-of-game"}" data-consumable-id="${consumable.id}">
          <span class="name">${consumable.name}</span>
          <div class="description">${consumable.description}</div>
        </li>`
      ).join("");
    });
  }

  fillCurrentTurnDebug() {
    reef.component(this.$(".debug .current-turn"), () => {
      return JSON.stringify(this.currentTurn || {}, null, 2).escapeHtml();
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
          `two boosts to different stats`,
          `three boosts to different stats`,
        ),
        Maker.tag("p", `Like in other Pathfinder things, you can't pick the same stat more than once in any given group.`),
        Maker.tag("p", `You should end up with a 5, a 4, a 3,and a 2.`),
        Maker.tag("p", `But maybe that makes things too hard or too easy! We ca adjust this!`),
      ],
      possibleOutcomes: "",
    });

    this.domainSheet.data.abilityBoosts.forEach((boosts) => {
      activity.log(Maker.tag("hr"));
      activity.boost(...boosts);
    });
    this.domainSheet.data.abilityBoosts = null;

    this.activity(activity);
  }

  endTurn(event) {
    if (event && (this.domainSheet.leadershipActivitiesLeft > 0 || this.domainSheet.civicActivitiesLeft > 0)) {
      if (!confirm(`You still have actions left; are you sure you want to waste them and end your turn?`)) {
        return;
      }
    }

    // TODO make this a system activity, so it can log what happens
    this.entry({
      title: "Event",
      attrs: {class: "event"},
      body: (b) => {
        Maker.tag(b,
          Maker.tag("p", `Presumably some kind of event happens here and stuff happens. Adjust abilties and stats accordingly. Maybe it's one of these:`),
          new PickableGroup({
            options: {
              unrest: ["3 Unrest", {change: () => this.domainSheet.boost({by: 3}, "Unrest")}],
              abilityDown: ["Lower random ability", {change: () => this.domainSheet.reduce(Ability.random)}],
              fameDown: ["Lose 1 Fame", {change: () => this.domainSheet.useConsumable({name: "Fame"})}],
              other: ["I did something else"],
            },
            parts: [{change: event => {
              let picked = event.target.closest(".pickable");
              if (picked) {
                this.domainSheet.useAllConsumables({useBy: "end-of-turn"});
                this.newTurn();
              }
            }}],
          }),
        );
      },
    });
  }

  newTurn(name) {
    this.domainSheet.saveData();

    let lastTurn = this.domainSheet.data.turns.last();
    let summary = {
      entries: lastTurn.entries,
      abilityScores: this.domainSheet.abilityScores,
      statScores: this.domainSheet.statScores,
    };
    this.turnSummaries.push(summary);
    this.domainSummaryEntry(summary);
    
    this.debugEntry(lastTurn, `Completed turn`);
    this.resetTurn();
    this.turnMarker(name);
    this.domainSheet.addFame();
    this.ruin();
  }

  reroll(event) {
    let lastRoll = this.domainSheet.$("dice-roller");
    if (!lastRoll) { return }

    lastRoll.shadowRoot.querySelector("*").click(); // Ew
    
    let consumableId = event.target.closest(".consumable")?.dataset?.consumableId;
    consumableId && this.domainSheet.useConsumable({id: consumableId});
  }

  doActivity(event, {actionTarget}) {
    let activityName = actionTarget.dataset.activity;
    let activity = Activity.all.find(a => a.name == activityName);
    activity && this.activity(activity);
  }

  get currentActivity() { return this.entries.querySelector("leadership-activity, civic-activity") }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
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
      possibleOutcomes: "",
    });

    let doRuin = (threshold) => {
      if (activity.domainSheet.data.unrest >= threshold) {
        activity.log(`🤬 Unrest is higher than ${threshold}.`);
        let ability = Ability.random;
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
        Maker.tag("h4", "What happened"),
        Maker.tag("div", {class: "entries-summary"}, summary.entries.map(entry =>
          Maker.tag("a", Activity.icon(entry.name), {
            href: "#",
            title: entry.name,
            class: `entry-summary`,
            "data-type": entry.type,
            "data-used-ability": entry.usedAbility,
            "data-outcome": entry.outcome,
            click: () => { setTimeout(() => document.getElementById(entry.id).scrollIntoView(), 1) }})
        )),
        Maker.tag("h4", "Stats at end of turn"),
        Maker.dl(this.withDiffs(summary.abilityScores, lastTurnSummary?.abilityScores), {class: "dl-oneline"}),
        Maker.dl(this.withDiffs(summary.statScores, lastTurnSummary?.statScores), {class: "dl-oneline"}),
      ],
    })
  }

  activity(activity) {
    this.entries.prepend(activity);
    activity.actorId = this.domainSheet.currentActor.id;
    this.domainSheet.data.turns.last().entries.push(activity.record);
  }

  entry({title, description, body, attrs} = {}) {
    Maker.tag("article", {class: "entry", prependTo: this.entries}, attrs, [
      Maker.tag("header", title),
      Maker.tag("blockquote", {class: "description"}, description),
      Maker.tag("section", {class: "body"}, body),
    ]);
  }

  debugEntry(obj, title) {
    Maker.tag("code", {class: "debug", prependTo: this.entries, title}, Maker.tag("pre", JSON.stringify(obj, null, 2)));
  }

  reenactHistory() {
    let turns = this.domainSheet.data.turns;
    turns.forEach((turn, turnNumber) => {
      this.debugEntry(turn, `Saved turn #${turnNumber} of ${turns.length}`);
      turn.entries.forEach(entry => this.savedEntry(entry));
      if (turns.length > turnNumber + 1) { this.turnMarker(`Turn ${turnNumber + 1} (from save)`) }
    });

    this.entry({
      title: "Welcome back, Domainkeeper",
      description: "Here's your saved domain. How's it going?",
      body: ["Stuff happened, but I don't recall all of it."],
    });
  }

  savedEntry(entry) {
    let actor = this.domainSheet.actor(entry.actorId);

    this.entry({
      title: [entry.name, actor && Maker.tag("small", `by ${actor.name}`)],
      body: Maker.tag("section", {class: "log"}, entry.log.map(l => Maker.tag("p", p => {p.innerHTML = l}))),
      attrs: {
        id: entry.id,
        "data-type": entry.type,
        "data-actor-id": entry.actorId,
        "data-used-ability": entry.usedAbility,
        "data-outcome": entry.outcome,
      },
    });
  }
}
DomainActivityLog.define("domain-activity-log");
