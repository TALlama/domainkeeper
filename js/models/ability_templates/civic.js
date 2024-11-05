import { Ability } from "../abilities.js";
import { BuildingSite } from "../building_site.js";
import { Structure } from "../structure.js";

export var civicTemplates = [{
  icon: "💰",
  name: "Contribute",
  summary: "This settlement is hard at work.",
  decisions: [{
    name: "Contribution",
    template: "Payment",
    saveAs: "contribution",
  }],
  added() {
    let amount = -1;
    if (this.actor.hasTrait("City")) { amount -= 1 }
    this.decision("Contribution").amount = amount;
  },
}, {
  icon: "🚧",
  name: "Build Structure",
  summary: "Construct something in this settlement that will have long-term benefits",
  description: () => `Add building's cost to the DC`,
  decisions: [{
    name: "Pick a structure",
    structureCount() {
      return this.actor.powerups.matches({type: "structure"}).length
    },
    structuresMaxed() {
      if (this._structuresMaxed) { return this._structuresMaxed }

      let structureCount = this.structureCount();
      let {size, structureLimit, level, threshold, nextSize} = [
        {size: "Village", structureLimit: 8, level: 3, threshold: "9th", nextSize: "Town"},
        {size: "Town", structureLimit: 16, level: 7, threshold: "17th", nextSize: "City"},
        {size: "City", structureLimit: 32, level: 15, threshold: "33rd", nextSize: "Metropolis"},
        {size: "Metropolis", structureLimit: 64, level: 21, threshold: "67th", nextSize: "Megalopolis"},
      ].find(({size}) => this.actor.hasTrait(size));

      if (this.domain.hasFeat("Public Programs")) {
        structureLimit += 2;
        threshold = {10: "11th", 18: "19th", 34: "35th", 68: "69th"}[structureLimit];
      }

      if (this.domain.level >= level) {
        return this._structuresMaxed = {
          maxed: false,
          description: `Choose a structure you want to build. This ${size} will grow to a ${nextSize} when you build the ${threshold} structure.`,
          size, structureLimit, level, threshold, nextSize,
        };
      } else if (structureCount < structureLimit) {
        return this._structuresMaxed = {
          maxed: false,
          description: `Choose a structure you want to build. This ${size} can contain ${structureLimit} structures.`,
          size, structureLimit, level, threshold, nextSize,
        };
      } else {
        return this._structuresMaxed = {
          maxed: true,
          description: `This ${size} can only contain ${structureLimit} structures. Domain must be level ${level} to build a ${threshold} building and become a ${nextSize}.`,
          size, structureLimit, level, threshold, nextSize,
        };
      }
    },
    description() { return this.structuresMaxed().description;},
    saveAs: "structureName",
    options() { return Structure.availableTemplates(this.domain.level).map(s => s.name) },
    groupOptionsBy: structureName => `Level ${Structure.template(structureName).level}`,
    optionDisableReason(structureName) {
      let maxed = this.structuresMaxed();
      if (maxed.maxed) { return maxed.description }

      let alreadyBuilt = this.actor.powerups.matches({template: structureName});
      if (alreadyBuilt.length === 0) { return null }

      let limit = alreadyBuilt[0].limit;
      return alreadyBuilt.length >= limit ? `${this.actor.name} already has ${alreadyBuilt.length} structure${limit === 1 ? "" : "s"} of type "${structureName}"` : null;
    },
    displayValue: structureName => `<structure-description name="${structureName}"></structure-description>`,
    displayTitleValue: structureName => structureName,
    picked(structureName) {
      let validFoundations = this.decision("Foundation").validOptions();
      if (validFoundations.length === 1) {
        this.decision("Foundation").resolution = validFoundations[0];
      }
      this.decision("Roll").difficultyClassOptions.base = Structure.template(structureName)?.dc;
    },
    mutable: (activity, decision) => activity.decision("Roll").mutable,
  }, {
    name: "Foundation",
    saveAs: "foundationId",
    options() {
      let settlement = this.activity.actor;
      let upgradables = settlement?.powerups?.filter(s => s.upgradeTo?.length) || [];
      return [...upgradables.map(s => s.id), "new"];
    },
    optionDisableReason(foundationId) {
      if (foundationId === "new") { return null } // can always start from scratch

      let settlement = this.activity.actor;
      let foundation = settlement?.powerup(foundationId);
      if (!foundation) { return null } // can always start from scratch
      
      // Does this foundation match the structure picked?
      let structureName = this.activity.structureName;
      if (!foundation.upgradeTo) { return `Cannot upgrade ${foundation.name}` }
      if (foundation.upgradeTo.length === 0) { return `Cannot upgrade ${foundation.name} into a ${structureName}` }
      if (!foundation.upgradeTo.includes(structureName)) { return `Cannot upgrade ${foundation.name} into a ${structureName}` }

      let existingBuildSite = settlement.powerups.find(p => p.foundationId === foundation.id);
      if (existingBuildSite) { return `You are already building a ${existingBuildSite.name} on this foundation` }
    },
    displayValue(foundationId) {
      let settlement = this.activity.actor;
      let structure = foundationId ? settlement.powerup(foundationId) : null;
      return structure ? `Upgrade ${structure.name}` : "Start from scratch"
    },
    mutable: (activity, decision) => activity.decision("Roll").mutable,
  }, {
    name: "Payment",
    options() {
      let settlement = this.activity.actor;
      let maxSpend = settlement ? (settlement.hasTrait("Metropolis") ? 4 : (settlement.hasTrait("City") ? 3 : (settlement.hasTrait("Town") ? 2 : 1))) : 0;

      return [
        ...Array.from({length: maxSpend}, (init, ix) => ix + 1).flatMap(n => Ability.all.map(a => `${a}:${n}`)),
      ];
    },
    displayValue: (value) => value ? `Reduce ${value.split(":")[0]} by ${value.split(":")[1]} to proceed` : "…",
    optionDisableReason(payment) {
      let [ability, amount] = payment.split(":");
      amount = parseInt(amount);

      let current = this.domain[ability.toLowerCase()];
      if (current <= amount) { return `${ability} is too low to afford this` }

      let structureName = this.activity.structureName;
      if (structureName) {
        let cost = new Structure({template: structureName}).cost;
        if (amount > cost) { return `${amount} is more than this structure costs` }
      }
    },
    
    nonAbilityPaid(payment, context) {
      let [ability, amount] = payment.split(":");
      this.amount = parseInt(amount);
      this.picked(ability, context);
    },
  }, {
    name: "Roll",
    options: ["Economy"],
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Progress 150% of what you spent`,
      success: `Progress 100% of what you spent`,
      failure: `Progress 50% of what you spent`,
      criticalFailure: `Make no progress`,
    },
  }],
  findBuildingSite() {
    return this.actor.powerups.matches({incompleteTemplate: this.structureName})[0] ||
      BuildingSite.add({attributes: {incompleteTemplate: this.structureName, foundationId: this.foundationId}, actor: this.actor, activity: this});
  },
  makeProgresss(progress) {
    if (progress === 0) { return }

    this.findBuildingSite().improve(progress, {actor: this.actor, activity: this});
  },
  baseProgress() {
    let outlay = this.decision("Payment")?.amount || 1;
    let bonus = this.actor.powerup("Planning Bureau") ? 2 : (this.actor.powerup("Masonic Lodge") ? 1 : 0);
    return outlay + bonus;
  },
  criticalSuccess() {
    this.info("🏗️ Progress is quick.");
    this.makeProgresss(Math.ceil(this.baseProgress() * 1.5));
  },
  success() {
    this.info("📐 Progress is quick.");
    this.makeProgresss(this.baseProgress());
  },
  failure() {
    this.info("🐛 Progress is slow.");
    this.makeProgresss(Math.floor(this.baseProgress() * .5));
  },
  criticalFailure() {
    this.info("🚫 No progress is made.");
    this.makeProgresss(0);
  },
}].map(a => { return {type: "civic", ...a}});
