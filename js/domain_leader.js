export class DomainLeader {
  constructor(properties) {
    Object.assign(this, properties);
    this.id ??= `leader-${this.name}-${crypto.randomUUID()}`;
    this.activitiesPerTurn ??= this.type == "PC" ? 2 : 1;
  }

  get domainSheet() { return document.querySelector("domain-sheet") }
  get currentTurn() { return this.domainSheet?.data?.turns?.last() }
  get activitesTaken() { return this.currentTurn?.entries?.filter(e => e.actorId === this.id) || [] }
  get activitiesLeft() { return this.activitiesPerTurn - this.activitesTaken.length }
}

window.DomainLeader = DomainLeader;
