import { Ability } from "../models/abilities.js";
import { Activity } from "../models/activity.js";

import {RxElement} from "./rx_element.js";
import {ActivitySheet} from "./activity_sheet.js";
import {PickableGroup} from "./pickable_group.js";
import {ActivityPicker} from "./activity_picker.js";
import { debugJSON } from "../helpers.js";

export default class DomainActivityLog extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
    this.addEventListener("domains:nudge", (event) => this.doNudge(event))

    // TODO do we need to reenact history?
    this.turnSummaries = []; // TODO can this go in the entries to get persisted?
    this.currentTurn || this.newTurn();
    
    this.domainConcept();
    this.welcome();
    // TODO start turn 1

    let activityFinder = this.searchParams.get("activity");
    activityFinder && this.activity(new Activity({name: activityFinder}));
  }

  welcome() {
    let name = "Welcome, Domainkeeper";
    if (this.currentTurn.number > 0 || this.domainSheet.activitiesWhere({name}).length > 0) return;

    this.activity(new Activity({name}));
  }

  resetTurn() {
    delete this.domainSheet.data.currentActorId; // TODO move that into turn
    this.domainSheet.data.leaders.forEach(l => l.rollInitiative()); // TODO this too
    let turns = this.domainSheet.data.turns;
    let newTurn = {number: turns.length, entries: []};
    if (turns.length === 0) { newTurn.name = "Domain creation" }
    turns.push(newTurn);
  }

  domainConcept() {
    let name = "Domain Concept";
    if (this.currentTurn.number > 0 || this.domainSheet.activitiesWhere({name}).length > 0) return;

    // TODO it'd be nice if this prevented you from overflowing your ability scores
    let activity = new Activity({name});
    this.activity(activity);
    //activity.government = "Culture";
  }

  endTurn(event) {
    if (event && (this.domainSheet.leadershipActivitiesLeft > 0 || this.domainSheet.civicActivitiesLeft > 0)) {
      if (!confirm(`You still have actions left; are you sure you want to waste them and end your turn?`)) {
        return;
      }
    }

    let resolutions = {
      "1d4 Unrest": ({activity}) => activity.boost({by: [1, 2, 3, 4].random()}, "Unrest"),
      ...Ability.all.toDictionary(ability => [`Lower ${ability}`, ({activity}) => activity.reduce(ability)]),
      "Lower random ability": ({activity}) => activity.reduce(Ability.random),
      "Lose 1 Fame": ({activity}) => activity.domainSheet.useConsumable({name: "Fame"}),
      "I did something else": ({activity}) => {},
    };

    this.activity(new Activity({
      icon: "💥",
      name: "Event",
      actorId: "system",
      description: () => `Time marches on. The GM has an event to read.`,
      decisions: [{
        name: "Roll",
        description: "You probably need to roll to avoid something bad happening, or to make sure something good happens.",
      }, {
        name: "Outcome",
      }, {
        name: "Resolution",
        options: Object.keys(resolutions),
        picked: (resolution, context) => {
          resolutions[resolution](context);
          this.domainSheet.useAllConsumables({useBy: "end-of-turn"});
          this.newTurn();
        }
      }]
    }));
  }

  newTurn(name) {
    this.domainSheet.saveData();

    let lastTurn = this.domainSheet.data.turns.last() || {};
    let summary = {
      entries: lastTurn.entries || [],
      abilityScores: this.domainSheet.abilityScores,
      statScores: this.domainSheet.statScores,
    };
    this.turnSummaries.push(summary);
    this.domainSummaryEntry(summary);
    
    this.debugEntry(lastTurn, `Completed turn`);
    this.resetTurn();
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
    let name = actionTarget.dataset.activity;
    name && this.activity(new Activity({name}));
  }

  // TODO get currentActivity() { return this.entries.querySelector("activity-sheet") }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get currentActivity() { return this.currentTurn?.entries?.last() }
  get turn() { return this.turnSummaries.length; }

  turnSummary(turn = this.turn) {
    return this.turnSummaries[turn - 1];
  }

  ruin() {
    return; // TODO fix

    let activity = new ActivitySheet({
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
          Maker.tag("a", ActivitySheet.icon(entry.name), {
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
    activity.actorId ??= this.domainSheet.currentActor.id;
    this.currentTurn.entries.push(activity);
  }

  /////////////////////////////////////////////// Event handling

  doNudge(event) {
    let activity = this.currentActivity;
    if (!["Nudge", "Event"].includes(activity?.name)) {
      activity = new Activity({name: "Nudge"})
      this.activity(activity);
    };
    event.detail.complete(activity);
  }

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      <aside class="status-banner">${this.renderStatusBanner()}</aside>
      <actor-sheet></actor-sheet>
      <ul class="consumables">${this.renderConsumables()}</ul>
      ${debugJSON(this.currentTurn)}
      <main class="entries">${this.renderEntries()}</main>`
  }

  renderStatusBanner() {
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
  }

  renderConsumables() {
    return Object.values(this.domainSheet.data.consumables).map(consumable => `
      <li class="consumable" ${consumable.action ? `data-action="${consumable.action}"` : ""} data-use-by="${consumable.useBy ?? "end-of-game"}" data-consumable-id="${consumable.id}">
        <span class="name">${consumable.name}</span>
        <div class="description">${consumable.description}</div>
      </li>`
    ).join("");
  }

  renderEntries() { return this.domainSheet.data.turns.map(turn => this.renderTurn(turn)).reverse().join("") }

  renderTurn(turn) {
    let entries = turn.entries;

    return `
      <div class="turn-marker"><span class="turn-name">${turn.name || `Turn ${turn.number}`}<span></div>
      ${entries.map(entry => `<activity-sheet key="${entry.id}" activity-id="${entry.id}"></activity-sheet>`).reverse().join("")}
    `;
  }

  entry({title, description, body, attrs} = {}) {
    // TODO handle these
    //Maker.tag("article", {class: "entry", prependTo: this.entries}, attrs, [
    //  Maker.tag("header", title),
    //  Maker.tag("blockquote", {class: "description"}, description),
    //  Maker.tag("section", {class: "body"}, body),
    //]);
  }

  debugEntry(obj, title) {
    // TODO what?
    Maker.tag("code", {class: "debug", prependTo: this.entries, title}, Maker.tag("pre", JSON.stringify(obj, null, 2)));
  }

  reenactHistory() {
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
