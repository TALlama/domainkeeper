import { addTransient } from "./utils.js";
import { Structure } from "./structure.js";

let powerupClasses = {
  structure: Structure,
};
function makePowerup(properties, actor) {
  return properties.constructor === Object
    ? new powerupClasses[(properties.type || "Structure").toLowerCase()](properties, actor)
    : properties;
}

export class Actor {
  constructor(properties) {
    addTransient(this, {value: {}});
    Object.defineProperty(this, "powerups", {enumerable: true,
      get() { return this.transient.powerups },
      set(value) { this.transient.powerups = value.map(v => makePowerup(v, this)) },
    });

    Object.assign(this, properties);
    this.id ??= `leader-${this.name}-${crypto.randomUUID()}`;
    this.activitiesPerTurn ??= this.type == "PC" ? 2 : 1;
    this.initiative ??= this.rollInitiative();
    this.powerups ??= [];
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet?.data?.turns?.last() }

  get isLeader() { return this.domainSheet.data.leaders.find(l => l.id == this.id) }
  get isSettlement() { return this.domainSheet.data.settlements.find(l => l.id == this.id) }

  // Activities

  get activitesTaken() { return this.currentTurn?.activities?.filter(e => e.actorId === this.id) || [] }
  set activitesTaken(value) { /* ignore */ }
  get activitiesLeft() { return this.activitiesPerTurn + this.bonusActivities - this.activitesTaken.length }
  get bonusActivities() {
    let byId = this.currentTurn?.bonusActivities;
    return byId ? (byId[this.id] || 0) : 0;
  }
  set bonusActivities(value) {
    let turn = this.currentTurn;
    if (turn) {
      turn.bonusActivities ||= {};
      turn.bonusActivities[this.id] = value;
    }
  }

  // Powerups

  powerup(id) { return this.powerups.find(p => p.id === id) }

  removePowerup(powerup) {
    let index = this.powerups.indexOf(powerup);
    index > -1 && this.powerups.splice(index, 1);
  }

  rollInitiative() { return this.initiative = Number((Math.random() * 20).toFixed()) }
}
