import { addTransient, hydrateList } from "./utils.js";
import { Activity } from "./activity.js";

let abilitiesStartAt = 2;

export class Turn {
  constructor(properties, domain) {
    addTransient(this, {value: {domain}});
    hydrateList(this, {name: "activities", type: Activity});

    Object.assign(this, properties);
    this.number ??= domain.turns.length;
    this.name ??= "";

    if (this.number === 0) {
      this.addUniqueActivity({name: "Domain Concept"});
      this.addUniqueActivity({name: "Welcome, Domainkeeper"});
    }
  }

  /////////////////////////////////////////////// Associations
  get domain() { return this.transient.domain }
  set domain(value) { this.transient.domain = value }
  get currentActivity() { return this.activities.findLast(a => !a.resolved) }

  /////////////////////////////////////////////// Attrbutes
  get resolved() { return this.activities.filter(a => a.actorId !== "system").all("resolved", false) }

  activitiesNamed(name) { return this.activities.matches({name}) }
  addActivity(properties) {
    this.activities = [...this.activities, properties];
    let newActivity = this.activities.last();
    newActivity.added && newActivity.added();
    return newActivity;
  }
  addUniqueActivity(properties) { return this.activitiesNamed(properties.name).length || this.addActivity(properties) }

  cancelActivity(activity) {
    let ixThis = this.activities.findIndex(a => a.id == activity.id);
    if (ixThis > -1) {
      this.activities = [...this.activities.splice(0, ixThis), ...this.activities.splice(1)]
    }
  }

  activityResolved(activity) {
    this.domain?.activityResolved({activity, turn: this});

    if (this.number === 0 || this.resolved) {
      this.domain?.turnResolved({activity, turn: this});
    }
  }
}
