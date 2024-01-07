import { Ability } from "../models/abilities.js";
import { Activity } from "../models/activity.js";

import { debugJSON } from "../helpers.js";
import { ActivitySheet } from "./activity_sheet.js";
import { ActivityPicker } from "./activity_picker.js";
import { RxElement } from "./rx_element.js";

export default class DomainActivityLog extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
    this.addEventListener("domains:nudge", (event) => this.doNudge(event))

    if (!this.currentTurn) {
      this.newTurn();
      this.domainConcept();
      this.welcome();
    }

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

    this.activity(new Activity({name: "Event"}));
  }

  newTurn(name) {
    this.domainSheet.saveData();
    this.currentTurn && this.domainSummary();
    
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

  ruin() { this.activity(new Activity({name: "Ruin"})) }
  domainSummary() { this.activity(new Activity({name: "Domain Summary"})) }

  activity(activity) {
    activity.actorId ??= this.domainSheet.currentActor.id;
    this.currentTurn.entries.push(activity);
    activity.added && activity.added();
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
      ${entries.map(entry => `<activity-sheet key="${entry.id}" id="${entry.id}" activity-id="${entry.id}"></activity-sheet>`).reverse().join("")}
    `;
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
}
DomainActivityLog.define("domain-activity-log");
