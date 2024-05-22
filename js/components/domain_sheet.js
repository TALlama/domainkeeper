import { mod } from "../helpers.js";

import { makeId } from "../models/with_id.js";
import { Ability } from "../models/abilities.js";
import { Activity } from "../models/activity.js";
import { Actor } from "../models/actor.js";
import { Domain } from "../models/domain.js";
import { DomainRoll } from "../models/domain_roll.js";
import { Structure } from "../models/structure.js";

import { nudge } from "./event_helpers.js";
import { notify } from "./toast.js";
import { RxElement } from "./rx_element.js";
import { DomainEditor } from "./domain_editor.js";

let nudgeValue = function(el, name, data, key, newValue) {
  let was = data[key];
  nudge(el, activity => activity.boost({prefix: "Nudge", by: newValue - was, activity}, name));
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
    let actor = this.domain.actors.find(a => a.name === actorPicker || a.id === actorPicker);
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

  editDomain() {
    const editor = new DomainEditor();
    editor.setAttribute("label", this.domain.name);
    document.body.append(editor);
  }

  async doSaveData() {
    // see https://webkit.org/blog/14403/updates-to-storage-policy/
    if (navigator.storage && navigator.storage.persisted) {
      const persistent = await navigator.storage.persisted();
      if (!persistent) await navigator.storage.persist();
    }

    this.saveData();
  }

  swapSaveSlot() {
    this.promptSave()

    let dialog = Object.assign(document.createElement("sl-dialog"), {
      open: true,
      label: "Which save slot should we use?",
      innerHTML: `
        <sl-button-group>
          <sl-button size="small" data-action="newDomain">
            <sl-icon slot="prefix" name="plus-circle"></sl-icon>
            New Domain
          </sl-button>
          <sl-button size="small" data-action="importDomain">
            <sl-icon slot="prefix" name="file-earmark-arrow-down"></sl-icon>
            Import Domain
          </sl-button>
        </sl-button-group>
        <div class="save-slots">
          ${Object.entries(this.saveSlots.root).map(([slot, domain]) =>
            `<div class="save-slot">
              <input type="radio" id="use-slot-${slot}" name="use-slot" value="${slot}" ${slot === this.domainKey ? "checked" : ""}/>
              <label for="use-slot-${slot}" title="${slot}">
                ${domain.name} <span class="metadata">Level ${domain.level} @ Turn ${domain.turns.length - 1}</span>
              </label>
              <code class="hidden" id="domain-${slot}-source">${JSON.stringify(domain)}</code>
              <sl-copy-button from="domain-${slot}-source" copy-label="Click to copy JSON">
                <sl-icon slot="copy-icon" name="file-earmark-arrow-up"></sl-icon>
              </sl-copy-button>
            </div>`
          ).join("")}
        </div>
        <div slot="footer" style="display: flex">
          <sl-button class="delete" variant="danger" size="small" outline style="margin-right: auto">Delete</sl-button>
          <sl-button class="load" variant="primary">Load</sl-button>
        </div>
      `,
    });
    dialog.classList.add("save-slot-management");
    dialog.querySelector("sl-button[data-action='newDomain']").addEventListener("click", event => {
      this.newSaveSlot();
      dialog.hide();
    });
    dialog.querySelector("sl-button[data-action='importDomain']").addEventListener("click", async event => {
      await dialog.hide();
      this.showImportSaveDialog();
    });
    dialog.querySelector("sl-button.load").addEventListener("click", event => this.doSwapSaveSlot(event));
    dialog.querySelector("sl-button.delete").addEventListener("click", event => this.doClearData(event));
    dialog.addEventListener("sl-after-hide", (event) => event.target === dialog ? dialog.remove() : null);
    document.body.append(dialog);
  }

  doSwapSaveSlot(event) {
    let dialog = event.target.closest("sl-dialog");
    let selected = dialog?.querySelector("input:checked")?.value;
    if (!selected) { return }

    this.domainKey = selected;
    let data = this.load();
    notify(`Loaded ${data.name || "Domain"}`);
    dialog.hide();
  }

  showImportSaveDialog() {
    let dialog = Object.assign(document.createElement("sl-dialog"), {
      open: true,
      label: "Import JSON",
      innerHTML: `
        <sl-textarea label="Domain JSON" help-text="If you didn't copy JSON from somewhere, you're in the wrong place"></sl-textarea>
        <sl-button slot="footer" class="import" variant="primary">Import</sl-button>
      `,
    });
    dialog.addEventListener("sl-after-hide", (event) => event.target === dialog ? dialog.remove() : null);
    dialog.querySelector("sl-button.import").addEventListener("click", event => {
      const textarea = dialog.querySelector("sl-textarea");
      try {
        this.domainKey = makeId("slot");
        this.load(JSON.parse(textarea.value));
        this.saveData();
        dialog.hide();
      } catch (error) {
        alert(error);
      }
    });
    document.body.append(dialog);
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
    this.saveSlots.save({[this.domainKey]: this.domain});
    notify(`Domain saved. Long live ${this.domain.name}!`, {variant: "success", icon: "check-circle"});
  }

  load(data = this.loadData()) {
    this._data ??= reef.signal({});
    this._data.current = new Domain(data);
    this._pristineDomain = JSON.stringify(this._data.current);
    return data;
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
      <section class="settlements-section">${this.renderSettlements()}</section>
      <section class="leaders-section">${this.renderLeaders()}</section>`;
  }

  renderStats() {
    return `
      ${Ability.all.map(ability => this.renderStat(ability, {class: "ability", data: {"used-ability": ability}})).join("")}
      ${this.renderStat("Control DC", {readonly: true, value: this.domain.controlDC})}
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

    let dataAttrs = Object.entries(opts.data || {}).map(([dname, dval]) => `data-${dname}="${dval}"`).join(" ");

    return `
      <article class="stat ${opts.class || ""} ${opts.class === "ability" && value === 1 ? "ability---danger" : ""} stat---${stat.toLocaleLowerCase()}" ${dataAttrs}>
        <input class="current" type="number" id="domain-${stat}" @value="${value}" min="${this.domain.min(stat)}" max="${max}" ${opts.readonly ? "readonly" : ""} data-action="doNudge" data-stat="${stat}" />
        <sl-tooltip content="${this.statTooltip(stat)}" placement="right" hoist><label for="domain-${stat}">${stat}</label></sl-tooltip>
        <span class="max"><sl-tooltip content="Maxium value ${max}">${max}</sl-tooltip></span>
        <a href="#" class="ability-roll icon-link" data-ability="${stat}">🎲<span class="sr-only">Roll ${stat}</span></a>
      </article>`;
  }

  statTooltip(stat) {
    return {
      Culture: `Culture measures the interest and dedication of your nation and its people to the arts and sciences, to religion and reason, and to the subjects that your society chooses to learn about and to teach. Are your people well versed in rhetoric and philosophy? Do they value learning and research, music and dance? Do they embrace society in all its diverse splendor? If they do, your kingdom likely has a robust Culture score.`,
      Economy: `Economy measures the practical day-to-day workings of your society as it comes together to do the work of making and building, buying and selling. How industrious are your citizenry? Are they devoted to building more, higher, and better, trading in goods, services, and ideas? If so, your kingdom likely has a robust Economy score.`,
      Loyalty: `Loyalty measures the collective will, spirit, and sense of camaraderie the citizens of your nation possess. How much do they trust and depend on one another? How do they respond when you sound the call to arms or enact new laws? How do they react when other nations send spies or provocateurs into your lands to make trouble? If they support the kingdom’s leadership, the kingdom itself has a robust Loyalty score.`,
      Stability: `Stability measures the physical health and well- being of your nation. This includes its infrastructure and buildings, the welfare of its people, and how well things are protected and maintained under your rule. How carefully do you maintain your stores and reserves, repair things that are broken, and provide for the necessities of life? How quickly can you mobilize to shield your citizens from harm? A kingdom that can handle both prosperity and disaster efficiently and effectively has a robust Stability score.`,
      'Control DC': `The more powerful a kingdom grows, the more difficult it becomes to control it. The base Control DC for your kingdom is set by the kingdom’s level— fortunately, as you increase in level, your ability to successfully utilize your skills grows as well.`,
      Unrest: `Unrest represents unhappiness among the kingdom’s citizens, who show their lack of confidence in the leadership by balking at edicts, refusing to follow commands, and disrupting local economies through boycotts, walkouts, and refusal to talk to emissaries. Unrest is a persistent value that remains from turn to turn and can be adjusted during Kingdom turns as events play out.`,
      Size: `The total number of hexes in the kingdom. When a kingdom’s Size reaches 10, 25, 50, and 100, it gains kingdom XP as a milestone award (page 45).`,
      XP: `A kingdom gains experience (XP) by claiming hexes, reaching milestones, enduring kingdom events, or converting surplus RP at the end of a Kingdom turn.`,
      Level: `Kingdoms increase in level by gaining kingdom experience points (XP). At each new level, a kingdom improves attributes and focus areas beyond those provided by its basic background and the specific choices made at the time of its founding.`,
    }[stat];
  }

  renderName() {
    return `
      <span class="domain-name">${this.domain.name}</span>
      <a href="#" data-action="editDomain" class="icon-link" aria-label="Edit domain">📝</a>
      <span class="domain-data-management">
        <a href="#" data-action="doSaveData" class="icon-link ${this.changed ? "necessary" : "unnecessary"}">💾</a>
        <a href="#" data-action="swapSaveSlot" class="icon-link">🔀</a>
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

      return `<li id="${actor.id}" aria-role="button" class="actor ${(current == actor) ? "current" : ""} ${actor.available ? "available" : "unavailable"}" data-action="setCurrentActor">
        <span class="name">${actor.name}</span>
        <span class="status">${actor.available ? "" : "💤"}</span>
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
  get currentActor() { return this.domain.currentActorId ? this.domain.actor(this.domain.currentActorId) : this.readyActors.first() }

  readyActor(actorId) { return this.readyActors.find(a => a.id === actorId) }
  get readyActors() { return this.domain.availableActors.filter(a => a.activitiesLeft > 0) }
  
  settlement(name) { return this.domain.settlements.find(s => s.name === name) }
  structure(structureId) { return this.structures.find(s => s.id === structureId) }
  get structures() { return this.domain.actors.flatMap(a => a.powerups.matches({type: Structure.type})) }

  mod(ability) {
    let score = this.domain[ability.toLocaleLowerCase()];
    return mod(score);
  }

  info(message) { this.activityLog?.currentActivity?.info(message) }

  get diceTray() { return document.querySelector(".dice-tray") }

  roll({die, domainRoll, dc}) {
    let header = Maker.tag("h6");
    let componentsEl = Maker.tag("span", {class: "components", appendTo: header});
    domainRoll.bonuses.forEach((bonus) => {
      if (bonus.value !== 0) { componentsEl.append(Maker.tag("span", ` ${mod(bonus.value)} ${bonus.name || bonus.source?.name}`, {title: bonus.type})) }
    })
    header.prepend(Maker.tag("span", {class: "total"}, mod(domainRoll.bonus)));

    let roller = Maker.tag(
      "dice-roller",
      {dice: die || 20, modifier: domainRoll.bonus, "data-ability": domainRoll.ability, "data-activity": domainRoll.activity},
    );
    if (dc !== false) {
      dc = dc || this.domain.controlDC;
      header.append(Maker.tag("span", {class: "dc"}, ` ${dc}`));
      dc -= domainRoll.bonus; // see https://github.com/colinaut/dice-roller/issues/1
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
  if (trigger) { document.querySelector("domain-sheet").roll({domainRoll: new DomainRoll({domain: document.querySelector("domain-sheet").domain, ability: trigger.dataset.ability})}) }
});
