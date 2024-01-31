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
    let max = opts.max ?? this.max(stat);

    return `
      <article class="stat ${opts.class || ""} ${opts.class === "ability" && value === 1 ? "ability---danger" : ""} stat---${stat.toLocaleLowerCase()}">
        <input class="current" type="number" id="domain-${stat}" @value="${value}" min="0" max="${max}" ${opts.readonly ? "readonly" : ""} data-action="doNudge" data-stat="${stat}" />
        <label for="domain-${stat}">${stat}</label>
        <span class="max"><sl-tooltip content="Maxium value ${max}">${max}</sl-tooltip></span>
        <a href="#" class="ability-roll icon-link" data-ability="${stat}">🎲<span class="sr-only">Roll ${stat}</span></a>
      </article>`;
  }

  renderName() {
    return `
      <span class="domain-name">${this.domain.name}</span>
      <a href="#" data-action="renameDomain" aria-label="Rename domain">📝</a>
      <span class="domain-data-management">
        <a href="#" data-action="doSaveData" class="${this.changed ? "necessary" : "unnecessary"}">💾</a>
        <a href="#" data-action="swapSaveSlot">🔀</a>
        <a href="#" data-action="newSaveSlot">✨</a>
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
      this.style.setProperty(`--${key}-percent`, `${value * 100.0 / this.max(name)}%`);
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

  min(stat) {
    stat = stat.toLocaleLowerCase();

    if ("level size".split(" ").includes(stat)) { return 1 }
    return 0;
  }

  max(stat) {
    return this.maxBase(stat) + this.bonuses.matches({max: stat}).sum("value");
  }

  maxBase(stat) {
    stat = stat.toLocaleLowerCase();

    if (Ability.all.map(a => a.toLocaleLowerCase()).includes(stat)) { return 5 }
    if ("unrest level".split(" ").includes(stat)) { return 20 }
    if ("xp".split(" ").includes(stat)) { return 1000 }
    if ("size".split(" ").includes(stat)) { return 200 }
    return 99999;
  }

  get leadershipActivitiesLeft() { return this.domain.leaders.sum("activitiesLeft") }
  get civicActivitiesLeft() { return this.domain.settlements.sum("activitiesLeft") }
  get allActivitiesLeft() { return this.leadershipActivitiesLeft + this.civicActivitiesLeft }

  get controlDC() {
    let size = this.domain.size;
    let sizeMod = size < 10 ? 0 : (size < 25 ? 1 : (size < 50 ? 2 : (size < 100 ? 3 : 4)));

    let baseControlDCByLevel = {
      1: 14, // Charter, government, heartland, initial proficiencies, favored land, settlement construction (village)
      2: 15, // Kingdom feat
      3: 16, // Settlement construction (town), skill increase
      4: 18, // Expansion expert, fine living, Kingdom feat
      5: 20, // Ability boosts, ruin resistance, skill increase
      6: 22, // Kingdom feat
      7: 23, // Skill increase
      8: 24, // Experienced leadership +2, Kingdom feat, ruin resistance
      9: 26, // Expansion expert (Claim Hex 3 times/turn), settlement construction (city), skill increase
      10: 27, // Ability boosts, Kingdom feat, life of luxury
      11: 28, // Ruin resistance, skill increase
      12: 30, // Civic planning, Kingdom feat
      13: 31, // Skill increase
      14: 32, // Kingdom feat, ruin resistance
      15: 34, // Ability boosts, settlement construction (metropolis), skill increase
      16: 35, // Experienced leadership +3, Kingdom feat
      17: 36, // Ruin resistance, skill increase
      18: 38, // Kingdom feat
      19: 39, // Skill increase
      20: 40, // Ability boosts, envy of the world, Kingdom feat, ruin resistance
    };

    return sizeMod + baseControlDCByLevel[this.domain.level];
  }

  get currentTurn() { return this.domain.turns.last() }
  get previousTurn() { let turns = this.domain.turns || []; return turns[turns.length - 2]; }
  get currentActor() { return this.readyActor(this.domain.currentActorId) || this.readyActors.first() }

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

  get abilityScores() {
    return {
      Culture: this.domain.culture,
      Economy: this.domain.economy,
      Loyalty: this.domain.loyalty,
      Stability: this.domain.stability,
    };
  }

  get statScores() {
    return {
      Unrest: this.domain.unrest,
      Size: this.domain.size,
      XP: this.domain.xp,
      Level: this.domain.level,
    };
  }

  info(message) { this.activityLog?.currentActivity?.info(message) }

  modify({by}, names) {
    names.forEach(name => {
      let key = name.toLocaleLowerCase();
      let current = this.domain[key];
      let target = current + by;
      let max = this.max(name);
      let overage = target - max;
      this.domain[key] = Math.min(max, target);
      if (overage > 0) {
        this.info(`🛑 ${name} cannot be above ${max}; added ${overage*50}xp instead`);
        this.domain.xp += overage * 50;
      }
    })
  }
  boost(...names) {
    let {by} = names[0];
    by && names.shift();
    this.modify({by: by ?? 1}, names);
  }
  reduce(...names) {
    let {by} = names[0];
    by && names.shift();
    this.modify({by: by ?? -1}, names);
  }

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
