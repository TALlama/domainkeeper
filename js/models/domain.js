import { addTransient, hydrateList } from "./utils.js";
import { Ability } from "./abilities.js";
import { Actor } from "./actor.js";
import { Structure } from "./structure.js";
import { Turn } from "./turn.js";
import { nudge } from "../components/event_helpers.js";

let abilitiesStartAt = 2;

export class Domain {
  constructor(properties) {
    addTransient(this, {value: {}});
    hydrateList(this, {name: "leaders", type: Actor});
    hydrateList(this, {name: "settlements", type: Actor});
    hydrateList(this, {name: "turns", type: Turn});

    this.#setDefaults();
    Object.assign(this, properties);

    this.#addDefaultActors();
    this.#addDefaultTurns();
  }

  /////////////////////////////////////////////// Associations
  get currentTurn() { return this.turns.last() }
  get currentActivity() { return this.currentTurn?.currentActivity }

  actor(actorId) { return this.actors.find(a => a.id === actorId) }
  get actors() { return [...this.leaders, ...this.settlements] }
  set actors(value) { /* ignore */ }
  get availableActors() { return this.actors.filter(a => a.available) }
  set availableActors(value) { /* ignore */ }
  get unavailableActors() { return this.actors.filter(a => a.unavailable) }
  set unavailableActors(value) { /* ignore */ }

  get powerups() { return this.actors.flatMap(a => a.powerups) }
  set powerups(v) { /* ignore */ }

  get bonuses() { return this.powerups.flatMap(p => p.bonuses) }
  set bonuses(v) { /* ignore */ }

  /////////////////////////////////////////////// Defaults

  #setDefaults() {
    this.name ??= "Anvilania";
    this.level ??= 1;
    this.culture ??= abilitiesStartAt;
    this.economy ??= abilitiesStartAt;
    this.loyalty ??= abilitiesStartAt;
    this.stability ??= abilitiesStartAt;
    this.unrest ??= 0;
    this.size ??= 1;
    this.xp ??= 0;
    this.level ??= 1;

    this.consumables ??= [];
    this.turns ??= [];
  }

  #addDefaultActors() {
    if (this.leaders.length === 0) {
      this.leaders = [
        {traits: "PC".split(" "), name: "Seth"},
        {traits: "PC".split(" "), name: "Ben"},
        {traits: "PC".split(" "), name: "David"},
        {traits: "PC".split(" "), name: "Morgan"},
        {traits: "PC".split(" "), name: "Joe"},
        {traits: "NPC".split(" "), name: "Bertie"},
      ];
    }

    if (this.settlements.length === 0) {
      this.settlements = [
        {traits: "Village".split(" "), name: "Capital", icon: "⭐", powerups: [new Structure("Town Hall")], position: [80, 25]},
      ];
    }
  }

  #addDefaultTurns() {
    this.turns.length || this.#addTurn({name: "Domain Creation"});
    if (this.turns.length === 1 && this.turns[0].activities.all("resolved")) {
      this.newTurn();
    }
  }

  /////////////////////////////////////////////// Stats

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

  modify({by, activity}, names) {
    names.forEach(name => {
      let key = name.toLocaleLowerCase();
      let current = this[key];
      let target = current + by;
      let max = this.max(name);
      let overage = target - max;
      this[key] = Math.min(max, target);
      if (overage > 0) {
        (activity || this).info(`🛑 ${name} cannot be above ${max}; added ${overage*50}xp instead`);
        this.xp += overage * 50;
      }
    })
  }
  boost(...names) {
    let opts = (typeof names[0] === "object") ? names.shift() : {};
    opts.by ??= 1;
    this.modify(opts, names);
  }
  reduce(...names) {
    let opts = (typeof names[0] === "object") ? names.shift() : {};
    opts.by ??= -1;
    this.modify(opts, names);
  }

  get controlDC() {
    let size = this.size;
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

    return sizeMod + baseControlDCByLevel[this.level];
  }

  /////////////////////////////////////////////// Logging

  info(...args) {
    let activity = this.currentActivity;
    if (activity) {
      activity.info(...args);
    } else {
      nudge(document.querySelector("domain-sheet"), (activity) => activity.info(...args));
    }
  }

  /////////////////////////////////////////////// Turn Management

  #addTurn(properties = {}) {
    this.turns = [...this.turns, {...properties, number: this.turns.length}];
    return this.turns.last();
  }

  newTurn(properties = {}) {
    this.turns.last().addActivity({name: "Domain Summary"});

    this.leaders.forEach(l => l.rollInitiative()); // TODO this too

    let turn = this.#addTurn(properties);
    if (turn.number > 0) {
      turn.addUniqueActivity({name: "Ruin"});
      this.addFame();
      this.powerups.forEach(pu => pu.newTurn && pu.newTurn({domain: this, powerup: pu}));
    }
    document.querySelector("domain-sheet").saveData();
  }

  activityResolved({activity}) {
    if (activity.actorId === this.currentActorId && activity.actor.activitiesLeft === 0) {
      delete this.currentActorId; // TODO move that into turn
    }
  }

  turnResolved({turn}) {
    if (turn.number === 0) { this.newTurn() }
  }

  /////////////////////////////////////////////// Consumable Management

  findConsumables(pattern) { return this.consumables.matches(pattern) }

  addConsumable(attrs) {
    this.consumables.push({id: crypto.randomUUID(), name: "Consumable", description: "?", useBy: "end-of-turn", ...attrs});
  }

  useConsumable(pattern) {
    let index = this.consumables.findIndex(c => Object.matches(c, pattern));
    index > -1 && this.consumables.splice(index, 1);
  }

  useAllConsumables(pattern) {
    this
      .findConsumables(pattern)
      .forEach(consumable => this.useConsumable({id: consumable.id}));
  }

  addFame({activity} = {}) {
    let existing = this.findConsumables({name: "Fame"});
    if (existing.length < 3) {
      this.addConsumable({name: "Fame", description: "Reroll", action: "reroll", useBy: "end-of-time"});
    } else {
      (activity || this).info(`👨🏻‍🎤 Cannot have more than three Fame; added 100xp instead`);
      this.xp += 100;
    }
  }
}
