import { addTransient, hydrateList } from "./utils.js";
import { Actor } from "./actor.js";
import { Structure } from "./structure.js";
import { Turn } from "./turn.js";

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

  //actor(actorId) { return this.actors.find(a => a.id === actorId) }
  get actors() { return [...this.leaders, ...this.settlements] }
  //readyActor(actorId) { return this.readyActors.find(a => a.id === actorId) }
  //get readyActors() { return this.actors.filter(a => a.activitiesLeft > 0) }

  get powerups() { return this.actors.flatMap(a => a.powerups) }
  set powerups(v) { /* ignore */ }
  //structure(structureId) { return this.structures.find(s => s.id === structureId) }
  //get structures() { return this.powerups.matches({type: Structure.type})) }

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
        {traits: "NPC".split(" "), name: "Bertie", activitiesPerTurn: 1},
      ];
    }

    if (this.settlements.length === 0) {
      this.settlements = [
        {traits: "Village".split(" "), name: "Capital", activitiesPerTurn: 1, powerups: [new Structure("Town Hall")]},
      ];
    }
  }

  #addDefaultTurns() {
    this.turns.length || this.#addTurn({name: "Domain Creation"});
    if (this.turns.length === 1 && this.turns[0].activities.all("resolved")) {
      this.newTurn();
    }
  }

  /////////////////////////////////////////////// Turn Management

  #addTurn(properties = {}) {
    this.turns = [...this.turns, {...properties, number: this.turns.length}];
    return this.turns.last();
  }

  newTurn(properties = {}) {
    this.turns.last().addActivity({name: "Domain Summary"});

    delete this.currentActorId; // TODO move that into turn
    this.leaders.forEach(l => l.rollInitiative()); // TODO this too

    let turn = this.#addTurn(properties);
    if (turn.number > 0) {
      turn.addUniqueActivity({name: "Ruin"});
      this.addFame();
      this.powerups.forEach(pu => pu.newTurn && pu.newTurn({domain: this, powerup: pu}));
    }
    document.querySelector("domain-sheet").saveData();
  }

  turnResolved(turn) {
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

  addFame() {
    let existing = this.findConsumables({name: "Fame"});
    if (existing.length < 3) {
      this.addConsumable({name: "Fame", description: "Reroll", action: "reroll", useBy: "end-of-time"});
    } else {
      this.currentActivity?.info(`👨🏻‍🎤 Cannot have more than three Fame; added 100xp instead`);
      this.xp += 100;
    }
  }
}
