import { Ability } from "../models/abilities.js";
import { Activity } from "../models/activity.js";

import { twist } from "./animations.js";
import { debugJSON } from "../helpers.js";
import { ActivitySheet } from "./activity_sheet.js";
import { ActivityPicker } from "./activity_picker.js";
import { RxElement } from "./rx_element.js";

export default class DomainActivityLog extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
    document.addEventListener("domains:nudge", (event) => this.doNudge(event))

    let activityFinder = this.searchParams.get("activity");
    activityFinder && this.activity({name: activityFinder});
  }

  endTurn(event) {
    if (event && (this.domainSheet.leadershipActivitiesLeft > 0 || this.domainSheet.civicActivitiesLeft > 0)) {
      if (!confirm(`You still have actions left; are you sure you want to waste them and end your turn?`)) {
        return;
      }
    }

    this.activity({name: "Event"});
  }

  forEachPowerup(callback) {
    let globalContext = {domainSheet: this.domainSheet};
    this.domainSheet.actors.forEach(actor => {
      let actorContext = {...globalContext, actor};
      actor.isLeader && (actorContext.leader = actor);
      actor.isSettlement && (actorContext.settlement = actor);

      actor.powerups.forEach(powerup => {
        let context = {...actorContext, powerup};
        powerup.type && (context[powerup.type] = powerup);
        callback.call ? callback.call(powerup, context) : (powerup[callback] && powerup[callback](context));
      });
    })
  }

  reroll(event) {
    let lastRoll = this.domainSheet.$("dice-roller");
    if (!lastRoll) { return }

    lastRoll.shadowRoot.querySelector("*").click(); // Ew
    
    let consumableId = event.target.closest(".consumable")?.dataset?.consumableId;
    consumableId && this.domainSheet.domain.useConsumable({id: consumableId});
  }

  rerollEconomy(event) {
    let lastRoll = this.domainSheet.$("dice-roller");
    if (!lastRoll) { return }
    if (lastRoll.dataset.ability !== "Economy") return;
    
    this.reroll(event);
  }

  doActivity(event, {actionTarget}) {
    let name = actionTarget.dataset.activity;
    name && this.activity({name});
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet.currentTurn }
  get currentActivity() { return this.currentTurn?.activities?.last() }

  activity(activity) {
    activity.actorId ??= this.domainSheet.currentActor.id;
    this.currentTurn.addActivity(activity);
    setTimeout(() => twist(document.getElementById(activity.id)), 100);
  }

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      <aside class="status-banner">${this.renderStatusBanner()}</aside>
      ${this.currentTurn.number ? `<actor-sheet></actor-sheet>` : ""}
      ${this.renderConsumables()}
      ${debugJSON(this.currentTurn)}
      <main class="turns">${this.renderTurns()}</main>`
  }

  renderStatusBanner() {
    let abilities = this.domainSheet.domain;

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
    if (this.currentTurn.number === 0) { return "" }

    return `<ul class="consumables">
      ${Object.values(this.domainSheet.domain.consumables).map(consumable => `
        <li>
          <button class="consumable" ${consumable.action ? `data-action="${consumable.action}"` : ""} data-use-by="${consumable.useBy ?? "end-of-game"}" data-consumable-id="${consumable.id}">
            <span class="name">${consumable.name}</span>
            <div class="description">${consumable.description}</div>
          </button>
        </li>`
      ).join("")}
    </ul>`;
  }

  renderTurns() { return this.domainSheet.domain.turns.map(turn => this.renderTurn(turn)).reverse().join("") }

  renderTurn(turn) {
    let activities = turn.activities;
    let summary = activities.find(a => a.name === "Domain Summary");

    return `
    <article class="turn">
      <div class="turn-marker"><span class="turn-name">${turn.name || `Turn ${turn.number}`}<span></div>
      ${summary ? `<main class="activities activities---summary-spotlight">${this.renderActivity(summary)}</main>` : ""}

      <details ${turn === this.currentTurn ? "open" : ""}>
        <summary>${activities.length - 1} activities</summary>
        <main class="activities">
          ${activities.map(activity => activity === summary ? "" : this.renderActivity(activity)).reverse().join("")}
        </main>
      </details>
    </article>`;
  }

  renderActivity(activity) {
    return `<activity-sheet key="${activity.id}" id="${activity.id}" activity-id="${activity.id}"></activity-sheet>`
  }

  /////////////////////////////////////////////// Event handling

  doNudge(event) {
    let activity = this.currentActivity;
    if (!["Nudge", "Event"].includes(activity?.name)) {
      this.activity({name: "Nudge"});
      activity = this.currentTurn.activities.last();
    };
    event.detail.complete(activity);
  }

  smoothScroll(event) {
    let id = event.target.closest("[href^='#']").getAttribute("href").substr(1);
    let scrollTarget = document.getElementById(id);
    if (!scrollTarget) { return }

    let details = event.target.closest(".turn").querySelector(".turn > details");
    details.open = true;

    setTimeout(() => {
      scrollTarget.scrollIntoView({behavior: "smooth", block: "nearest"});
      twist(scrollTarget);
    }, 0);
  }
}
DomainActivityLog.define("domain-activity-log");
