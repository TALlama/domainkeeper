import { Ability } from "../models/abilities.js";
import { Activity } from "../models/activity.js";

import { denyUse, twist, useUp } from "./animations.js";
import { debugJSON } from "../helpers.js";
import { ActorEditor } from "./actor_editor.js";
import { ActivitySheet } from "./activity_sheet.js";
import { ActivityPicker } from "./activity_picker.js";
import { DomainMap } from "./domain_map.js";
import { DomainMapLegend } from "./domain_map_legend.js";
import { RxElement } from "./rx_element.js";

export default class DomainActivityLog extends RxElement {
  connectedCallback() {
    reef.component(this, () => this.render());
    this.addEventListener("click", this);
    document.addEventListener("domains:nudge", (event) => this.doNudge(event))

    let activityFinder = this.searchParams.get("activity");
    activityFinder && this.activity({name: activityFinder});
  }

  kickoffEvent(event) {
    if (this.domainSheet.allActivitiesLeft > 0) {
      if (!confirm(`You still have actions left; are you sure you want to waste them and end your turn?`)) {
        return;
      }
    }

    this.activity({name: "Event"});
  }

  forEachPowerup(callback) {
    let globalContext = {domainSheet: this.domainSheet};
    this.domain.actors.forEach(actor => {
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

  expire(event) {
    let consumableId = event.target.closest(".consumable")?.dataset?.consumableId;
    if (consumableId) {
      useUp(event.target.closest(".consumable")).then(() =>
        (this.currentActivity || this.domain).useConsumable({id: consumableId})
      );
    }
  }

  reroll(event, {forAbility, forActivity} = (event.detail || {})) {
    let consumable = event.target.closest(".consumable");
    forAbility ||= consumable.dataset.ability;
    forActivity ||= consumable.dataset.activity?.split(",");

    let lastRoll = this.domainSheet.diceTray.querySelector("dice-roller");
    if (!lastRoll) { return denyUse(consumable) }

    if (forAbility && lastRoll.dataset.ability !== forAbility) { return denyUse(consumable) }
    if (forActivity && !forActivity.includes(lastRoll.dataset.activity)) { return denyUse(consumable) }

    lastRoll.shadowRoot.querySelector("*").click(); // Ew
    this.expire(event);
  }

  doActivity(event, {actionTarget}) {
    let name = actionTarget.dataset.activity;
    name && this.activity({name});
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get domain() { return this.domainSheet.domain }
  get currentTurn() { return this.domainSheet.currentTurn }
  get currentActivity() { return this.currentTurn?.activities?.last() }

  activity(properties) {
    let activity = this.currentTurn.addActivity({...properties, fallbacks: {actorId: this.domainSheet.currentActor?.id}});
    setTimeout(() => twist(document.getElementById(activity.id)), 200);
  }

  /////////////////////////////////////////////// Rendering

  render() {
    return `
      <aside class="status-banner">${this.renderStatusBanner()}</aside>
      ${this.currentTurn.number ? `<actor-sheet></actor-sheet>` : ""}
      ${this.renderMap()}
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

  renderMap() {
    let markers = this.domain.markers.map(m => ({...m, editable: false}));
    let markersJson = JSON.stringify(markers);
    let hash = markersJson.split("").reduce((t, c) => t + c.charCodeAt(0), 0);

    return `
      <details id="map-hash-${hash}"><summary>Map</summary>
        <domain-map-legend prompt="Move stuff">
          <domain-map markers='${markersJson}'></domain-map>
        </domain-map-legend>
      </details>`;
  }

  renderConsumables() {
    if (this.currentTurn.number === 0) { return "" }

    return `<ul class="consumables">
      ${Object.values(this.domainSheet.domain.consumables).map(consumable => `
        <li>
          <button class="consumable" ${consumable.action ? `data-action="${consumable.action}"` : ""} ${consumable.activity ? `data-activity="${consumable.activity}"` : ""} ${consumable.ability ? `data-ability="${consumable.ability}"` : ""} data-use-by="${consumable.useBy ?? "end-of-game"}" data-consumable-id="${consumable.id}">
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
    let name = turn.name || `Turn ${turn.number}`;

    return `
    <article class="turn" data-turn-name="${name.replace(/[^a-zA-Z0-9 ]+/g, " ")}" data-turn-number="${turn.number}">
      <div class="turn-marker">
        <span class="turn-name">${name}</span>
        <a href="#" class="icon-link" data-action="renameTurn" aria-label="Rename turn">📝</a>
      </div>
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

  renameTurn(event) {
    let turnNumber = event.target.closest("[data-turn-number]")?.dataset?.turnNumber;
    if (turnNumber) {
      let turn = this.domain.turns.find(t => t.number === Number(turnNumber));
      let newName = turn && prompt("What shall we call this turn?", turn.name || `Turn ${turn.number}`);
      if (newName) { turn.name = newName }
    }
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
