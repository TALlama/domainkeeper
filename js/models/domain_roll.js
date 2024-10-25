import { addTransient } from "./utils.js";

export class DomainRoll {
  constructor({domain, ability, activity, actorType, option, ...properties}) {
    addTransient(this, {value: {}});
    Object.assign(this, {...properties, domain, ability, activity, actorType, option});
    
    const domainBonuses = domain.findBonuses({activity, ability, actorType}).sortBy("value");
    this.availableBonuses = [...domainBonuses, ...this.unrestBonuses]
      .filter(b => !b.option || b.option === this.option);
    
    let fortunes = this.divideBonuses("fortune").used;
    let misfortunes = this.divideBonuses("misfortune").used;
    this.keepSuffix = fortunes.length > misfortunes.length ? "kh" : (misfortunes.length > 0 ? "kl" : "");
    this.dieCount = (fortunes.length + misfortunes.length) > 0 ? 2 : 1;
  }

  get modifier() { return this.bonus }
  get unrestBonuses() {
    let unrest = this.domain.unrest;
    let penalty = unrest >= 15 ? -4 : (unrest >= 10 ? -3 : (unrest >= 5 ? -2 : (unrest >= 1 ? -1 : 0)));
    return penalty ? [{name: "Unrest", type: "status", source: {name: "Unrest"}, value: penalty}] : [];
  }

  // Available bonuses of each type
  availableBonusesOfType(type) { return this.availableBonuses.filter(b => b.type === type) }
  get availableItemBonuses() { return this.availableBonusesOfType("item") }
  get availableStatusBonuses() { return this.availableBonusesOfType("status") }
  get availableCircumstanceBonuses() { return this.availableBonusesOfType("circumstance") }
  get availableUntypedBonuses() { return this.availableBonusesOfType("untyped") }

  divideBonuses(type) {
    if (this.transient[type]) { return this.transient[type] }

    let available = this.availableBonusesOfType(type);
    if (type === "untyped") { return {type, modifier: available.sum("value"), used: available, unused: []} }
    if (type === "fortune" || type === "misfortune") { return {used: available, unused: []} };
    if (type === "outcomeBoost") { return {used: available.slice(0, 1), unused: available.slice(1)} };

    let biggestPenalty = available.filter(b => b.value < 0).first();
    let biggestBoost = available.filter(b => b.value > 0).last();
    let used = [biggestBoost, biggestPenalty].filter(b => b);
    let unused = available.filter(b => b !== biggestPenalty && b !== biggestBoost);

    used.forEach(b => b.used = true);
    unused.forEach(b => b.used = false);

    return this.transient[type] = {type, modifier: used.sum("value"), used, unused};
  }

  // Just the used bonuses: largest boost and largest penalty
  get bonuses() { return [...this.abilityBonuses, ...this.levelBonuses, ...this.itemBonuses, ...this.statusBonuses, ...this.circumstanceBonuses, ...this.untypedBonuses] }
  get abilityBonuses() { return [{name: this.ability, source: {name: "Ability"}, type: "ability", value: this.abilityBonus}] }
  get levelBonuses() { return [{name: "Level", source: {name: "Level"}, type: "level", value: this.levelBonus}] }
  get itemBonuses() { return this.divideBonuses("item").used }
  get statusBonuses() { return this.divideBonuses("status").used }
  get circumstanceBonuses() { return this.divideBonuses("circumstance").used }
  get untypedBonuses() { return this.divideBonuses("untyped").used }

  // Just the used boosts
  get boosts() { return [...this.divideBonuses("fortune").used, ...this.divideBonuses("outcomeBoost").used] }

  // Numeric bonus of the used bonuses
  get bonus() { return this.bonuses.sum("value") }
  get abilityBonus() { return this.domain[this.ability.toLowerCase()] }
  get levelBonus() { return this.domain.level }
  get itemBonus() { return this.divideBonuses("item").modifier }
  get statusBonus() { return this.divideBonuses("status").modifier }
  get circumstanceBonus() { return this.divideBonuses("circumstance").modifier }
  get untypedBonus() { return this.divideBonuses("untyped").modifier }

  // Just the unused bonuses
  get unusedBonuses() { return this.availableBonuses.filter(b => b.used === false) }
  get unusedItemBonuses() { return this.divideBonuses("item").unused }
  get unusedStatusBonuses() { return this.divideBonuses("status").unused }
  get unusedCircumstanceBonuses() { return this.divideBonuses("circumstance").unused }
  get unusedUntypedBonuses() { return this.divideBonuses("untyped").unused }
}
