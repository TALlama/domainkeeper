export class DomainLeader {
  constructor(properties) {
    Object.assign(this, properties);
    this.id ??= `leader-${this.name}-${crypto.randomUUID()}`;
    this.activitiesPerTurn ??= this.type == "PC" ? 2 : 1;
    this.initiative ??= this.rollInitiative();
    this.powerups ??= [];
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet?.data?.turns?.last() }
  get activitesTaken() { return this.currentTurn?.entries?.filter(e => e.actorId === this.id) || [] }
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

  rollInitiative() { return this.initiative = Number((Math.random() * 20).toFixed()) }
}
