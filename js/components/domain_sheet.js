import { mod } from "../helpers.js";

import { makeId } from "../models/with_id.js";
import { Ability } from "../models/abilities.js";
import { Activity } from "../models/activity.js";
import { Actor } from "../models/actor.js";
import { Domain } from "../models/domain.js";
import { Structure } from "../models/structure.js";

import { nudge } from "./event_helpers.js";
import { RxElement } from "./rx_element.js";
import { notify } from "./toast.js";

let nudgeValue = function(el, name, data, key, newValue) {
  let was = data[key];
  nudge(el, (activity) => activity.info(`💹 ${name} updated to ${newValue}<span class="metadata">, from ${was}</span>`));
  data[key] = Number(newValue)
}

class DomainSheet extends RxElement {
  get saveSlots() { return document.querySelector("save-slots") }
  get domainKey() { return window.localStorage["domainkey"] ?? "domain" }
  set domainKey(value) { window.localStorage["domainkey"] = value }

  connectedCallback() {
    this.load();

    reef.component(this, () => this.render());
    this.addEventListener("click", this);
    this.addEventListener("input", this);

    // For debugging; put `?actor=Seth` in the URL to make that one current
    let actorPicker = this.searchParams.get("actor");
    let actor = this.actors.find(a => a.name === actorPicker || a.id === actorPicker);
    if (actor) { this.domain.currentActorId = actor.id }

    // For debuging: put ?structures=all in the URL to give Capital one of each
    if (this.searchParams.get("structures") === "all") {
      let capital = this.domain.settlements[0];
      Structure.names.forEach(n =>
        capital.powerups.matches({name: n}).length || capital.powerups.push(new Structure(n))
      );
    };
  }

  get domain() { return this._data.current }
  get changed() { return !this._pristineDomain || JSON.stringify(this.domain) !== this._pristineDomain }

  renameDomain() {
    let newName = prompt("Name your domain", this.domain.name);
    if (newName) { this.domain.name = newName }
  }

  doSaveData() {
    this.saveData();
  }

  swapSaveSlot() {
    this.promptSave()

    let dialog = Object.assign(document.createElement("sl-dialog"), {
      label: "Which save slot should we use?",
      innerHTML: `
        <div>
          ${Object.entries(this.saveSlots.root).map(([slot, domain]) =>
            `<label for="use-slot-${slot}" style="display: block" title="${slot}">
              <input type="radio" id="use-slot-${slot}" name="use-slot" value="${slot}" ${slot === this.domainKey ? "checked" : ""}/>
              ${domain.name} <span class="metadata">Level ${domain.level} @ Turn ${domain.turns.length - 1}</span>
            </label>`
          ).join("")}
        </div>
        <div slot="footer" style="display: flex">
          <sl-button class="delete" variant="danger" size="small" outline style="margin-right: auto">Delete</sl-button>
          <sl-button class="load" variant="primary">Load</sl-button>
        </div>
      `,
    });
    dialog.querySelector("sl-button.load").addEventListener("click", event => this.doSwapSaveSlot(event));
    dialog.querySelector("sl-button.delete").addEventListener("click", event => this.doClearData(event));
    dialog.addEventListener("sl-after-hide", () => dialog.remove());
    document.body.append(dialog);
    dialog.show();
  }

  doSwapSaveSlot(event) {
    let dialog = event.target.closest("sl-dialog");
    let selected = dialog?.querySelector("input:checked")?.value;
    if (!selected) { return }

    this.domainKey = selected;
    this.load();
    notify(`Loaded from ${selected}`);
    dialog.hide();
  }

  doClearData(event) {
    let dialog = event.target.closest("sl-dialog");
    let selected = dialog?.querySelector("input:checked")?.value;
    if (!selected) { return }

    if (confirm("Really clear data? There is no undo")) {
      this.clearData(selected);
    }
  }

  clearData(slot = this.domainKey) {
    this.saveSlots.clear(slot);
  }

  newSaveSlot() {
    this.promptSave();
    this.domainKey = makeId("slot");
    this.load();
  }

  promptSave() {
    if (!this.changed) return;

    let saveAndContinue = confirm("Press OK to save changes to the current domain, or press cancel to continue without saving");
    if (saveAndContinue) { this.saveData() }
    return saveAndContinue;
  }

  saveData() {
    let memo = {};
    memo[this.domainKey] = this.domain;
    this.saveSlots.save(memo);
    notify(`Domain saved as ${this.domainKey}.`, {variant: "success", icon: "check-circle"});
  }

  load(data = this.loadData()) {
    this._data ??= reef.signal({});
    this._data.current = new Domain(data);
    this._pristineDomain = JSON.stringify(this._data.current);
  }

  loadData() {
    return this.saveSlots.load({key: this.domainKey, defaultValue: {}});
  }

  get activityLog() { return document.querySelector("domain-activity-log") }
  get activities() { return this.domain.turns.flatMap(t => t.activities) }
  activity(activityId) { return this.activities.find(a => a.id === activityId) }
  activitiesWhere(pattern) { return this.activities.matches(pattern) }

  render() {
    this.updateCssProperties();

    return `
      <h3 class="domain-header">${this.renderName()}</h3>
      <section class="stats">${this.renderStats()}</section>
      <section class="leaders-section">${this.renderLeaders()}</section>
      <section class="settlements-section">${this.renderSettlements()}</section>`;
  }

  renderStats() {
    return `
      ${Ability.all.map(ability => this.renderStat(ability, {class: "ability"})).join("")}
      <article class="hidden stat stat---domain-control-dc">
        <span class="label">Control DC</span><span id="domain-control-dc" class="current">${this.controlDC}</span>
      </article>
      ${this.renderStat("Control DC", {readonly: true, value: this.controlDC})}
      ${this.renderStat("Unrest")}
      ${this.renderStat("Size")}
      ${this.renderStat("XP")}
      ${this.renderStat("Level")}
    `;
  }

  renderStat(stat, opts = {}) {
    let key = opts.key ?? stat.toLocaleLowerCase();
    let value = opts.value ?? this.domain[key];
    let max = opts.max ?? this.domain.max(stat);

    return `
      <article class="stat ${opts.class || ""} ${opts.class === "ability" && value === 1 ? "ability---danger" : ""} stat---${stat.toLocaleLowerCase()}">
        <input class="current" type="number" id="domain-${stat}" @value="${value}" min="${this.domain.min(stat)}" max="${max}" ${opts.readonly ? "readonly" : ""} data-action="doNudge" data-stat="${stat}" />
        <label for="domain-${stat}">${stat}</label>
        <span class="max"><sl-tooltip content="Maxium value ${max}">${max}</sl-tooltip></span>
        <a href="#" class="ability-roll icon-link" data-ability="${stat}">🎲<span class="sr-only">Roll ${stat}</span></a>
      </article>`;
  }

  renderName() {
    return `
      <span class="domain-name">${this.domain.name}</span>
      <a href="#" data-action="renameDomain" class="icon-link" aria-label="Rename domain">📝</a>
      <span class="domain-data-management">
        <a href="#" data-action="doSaveData" class="icon-link ${this.changed ? "necessary" : "unnecessary"}">💾</a>
        <a href="#" data-action="swapSaveSlot" class="icon-link">🔀</a>
        <a href="#" data-action="newSaveSlot" class="icon-link">✨</a>
      </span>`;
  }


  activitx(count) { return count == 1 ? "1 activity" : `${count} activities`};

  renderLeaders() {
    return `
      <h4>Leaders <span class="badge" title="${this.activitx(this.leadershipActivitiesLeft)} left">${this.leadershipActivitiesLeft}</span></h4>
      <ul class="actors leaders list-unstyled">${this.renderActorList(this.domain.leaders.sortBy("-initiative"))}</ul>`;
  }

  renderSettlements() {
    return `
      <h4>Settlements <span class="badge" title="${this.activitx(this.civicActivitiesLeft)} left">${this.civicActivitiesLeft}</span></h4>
      <ul class="actors settlements list-unstyled">${this.renderActorList(this.domain.settlements)}</ul>`;
  }

  renderActorList(actors, current = this.currentActor) {
    return actors.map(actor => {
      let total = actor.activitiesPerTurn;
      let left = actor.activitiesLeft;

      return `<li id="${actor.id}" aria-role="button" class="actor ${(current == actor) ? "current" : ""}" data-action="setCurrentActor">
        <span class="name">${actor.name}</span>
        <span class="badge" title="${this.activitx(actor.activitiesLeft)} left">${actor.activitiesLeft}</span>
      </li>`;
    }).join("");
  }

  updateCssProperties() {
    [...Ability.all, ..."Unrest Size XP Level".split(" ")].forEach(name => {
      let key = name.toLocaleLowerCase();
      let value = this.domain[key];

      this.style.setProperty(`--${key}-value`, value);
      this.style.setProperty(`--${key}-percent`, `${value * 100.0 / this.domain.max(name)}%`);
    });
  }

  doNudge(event) {
    let stat = event.target.closest("[data-stat]")?.dataset?.stat;
    if (event.type === "input" && stat) { nudgeValue(event.target, stat, this.domain, stat.toLocaleLowerCase(), event.target.value) }
  }

  setCurrentActor(event) {
    let actorId = event.target.closest(".actor[id]").id;
    if (actorId) { this.domain.currentActorId = actorId }
  }

  get leadershipActivitiesLeft() { return this.domain.leaders.sum("activitiesLeft") }
  get civicActivitiesLeft() { return this.domain.settlements.sum("activitiesLeft") }
  get allActivitiesLeft() { return this.leadershipActivitiesLeft + this.civicActivitiesLeft }

  get currentTurn() { return this.domain.turns.last() }
  get previousTurn() { let turns = this.domain.turns || []; return turns[turns.length - 2]; }
  get currentActor() { return this.domain.currentActorId ? this.actor(this.domain.currentActorId) : this.readyActors.first() }

  actor(actorId) { return this.actors.find(a => a.id === actorId) }
  get actors() { return [...this.domain.leaders, ...this.domain.settlements] }
  readyActor(actorId) { return this.readyActors.find(a => a.id === actorId) }
  get readyActors() { return this.actors.filter(a => a.activitiesLeft > 0) }
  
  settlement(name) { return this.domain.settlements.find(s => s.name === name) }
  structure(structureId) { return this.structures.find(s => s.id === structureId) }
  get structures() { return this.actors.flatMap(a => a.powerups.matches({type: Structure.type})) }

  findBonuses({ability, ...pattern}) { return this.bonuses.matches(pattern).filter(b => !b.ability || b.ability === ability).sortBy("-value") }
  get bonuses() { return this.structures.flatMap(s => (s.bonuses || []).map(b => { return {...b, structure: s}})) }

  mod(ability) {
    let score = this.domain[ability.toLocaleLowerCase()];
    return mod(score);
  }

  info(message) { this.activityLog?.currentActivity?.info(message) }

  get unrestModifier() {
    let unrest = this.domain.unrest;
    return unrest >= 15 ? -4 : (unrest >= 10 ? -3 : (unrest >= 5 ? -2 : (unrest >= 1 ? -1 : 0)));
  }

  get diceTray() { return document.querySelector(".dice-tray") }

  roll({die, modifier, itemBonus, level, dc}) {
    let modifierValue = (modifier ? this.domain[modifier.toLocaleLowerCase()] : 0);
    let levelValue = (level === false ? 0 : this.domain.level);

    let components = [[modifier, modifierValue]];
    itemBonus && components.push(["Item", itemBonus]); // TODO it'd be nice to name the source
    components.push(["Level", levelValue]);
    components.push(["Unrest", this.unrestModifier]);
    let modifierTotal = 0;

    let header = Maker.tag("h6");
    let componentsEl = Maker.tag("span", {class: "components", appendTo: header});
    components.forEach((component) => {
      let [name, value] = component;
      if (value !== 0) {
        componentsEl.append(Maker.tag("span", ` ${mod(value)} (${name})`));
        modifierTotal += value;
      }
    })
    header.prepend(Maker.tag("span", {class: "total"}, mod(modifierTotal)));

    let roller = Maker.tag(
      "dice-roller",
      {dice: die || 20, modifier: modifierTotal, "data-ability": modifier},
    );
    if (dc !== false) {
      dc = dc || this.controlDC;
      header.append(Maker.tag("span", {class: "dc"}, ` ${dc}`));
      dc -= modifierTotal; // see https://github.com/colinaut/dice-roller/issues/1
      roller.setAttribute("difficulty", Math.max(1, dc));
    }
    this.diceTray.prepend(roller);
    this.diceTray.prepend(header);
    roller.shadowRoot.querySelector("div").click(); // Ew
  }
}
DomainSheet.define("domain-sheet");

document.addEventListener("click", (event) => {
  let trigger = event.target.closest(".ability-roll");
  if (trigger) { document.querySelector("domain-sheet").roll({modifier: trigger.dataset.ability}) }
});
