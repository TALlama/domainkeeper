import { addTransient, hydrateList } from "./utils.js";
import { makeId } from "./with_id.js";
import { withTraits } from "./with_traits.js";
import { BuildingSite } from "./building_site.js";
import { Structure } from "./structure.js";

let powerupClasses = {
  structure: Structure,
  "building-site": BuildingSite,
};
function makePowerup(properties, actor) {
  return properties.constructor === Object
    ? new powerupClasses[(properties.type || "Structure").toLowerCase()](properties, actor)
    : properties;
}

export class Actor {
  constructor(properties, domain) {
    addTransient(this, {value: {domain}});
    hydrateList(this, {name: "powerups", keepOrMake: (p) => makePowerup(p, this)});

    Object.assign(this, properties);
    this.id ??= makeId(`leader`, this.name);
    this.initiative ??= this.rollInitiative();
    this.traits ??= [];
    this.powerups ??= [];
  }

  get domain() { return this.transient.domain }
  get currentTurn() { return this.domain?.turns?.last() }

  get available() { return !this.hasTrait("AWOL", "Retired") }
  get unavailable() { return !this.available }
  get isLeader() { return this.hasTrait("PC", "NPC") }
  get isSettlement() { return this.hasTrait("Village", "Town", "City", "Metropolis") }

  // Activities

  get activitesTaken() { return this.currentTurn?.activities?.filter(e => e.actorId === this.id) || [] }
  set activitesTaken(value) { /* ignore */ }
  get activitiesPerTurn() { return this.hasTrait("Retired", "AWOL") ? 0 : this.hasTrait("PC", "Apt Pupil") ? 2 : 1 }
  set activitiesPerTurn(value) { /* ignore */ }
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

  powerup(id) { return this.powerups.find(p => p.id === id || p.name === id) }

  addPowerup(powerup) {
    this.powerups = [...this.powerups, powerup];
    this.bumpVersion();
  }

  removePowerup(powerup) {
    if (!powerup) { return }

    let index = this.powerups.findIndex(p => p.id === powerup.id);
    if (index > -1) {
      this.powerups = [...this.powerups.splice(0, index), ...this.powerups.splice(1)];
    }
  }

  rollInitiative() { return this.initiative = Number((Math.random() * 20).toFixed()) }

  bumpVersion() { this.version = (this.version || 0) + 1 }
}
withTraits(Actor);
