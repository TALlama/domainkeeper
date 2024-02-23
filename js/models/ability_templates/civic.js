import { Ability } from "../abilities.js";
import { BuildingSite } from "../building_site.js";
import { Structure } from "../structure.js";

import { AvalableStructures } from "../../components/available_structures.js";
import { StructureDescription } from "../../components/structure_description.js";

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
    description() { return "Choose a structure you want to build." },
    saveAs: "structureName",
    options: () => new AvalableStructures().names,
    groupOptionsBy: structureName => `Level ${Structure.template(structureName).level}`,
    optionDisableReason(structureName) {
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
      let upgradables = settlement.powerups.filter(s => s.upgradeTo?.length);
      return [...upgradables.map(s => s.id), "new"];
    },
    optionDisableReason(foundationId) {
      if (foundationId === "new") { return null } // can always start from scratch

      let settlement = this.activity.actor;
      let foundation = settlement.powerup(foundationId);
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
      criticalSuccess: `Build it; Boost a random Ability by 1`,
      success: `Build it`,
      failure: `Fail`,
      criticalFailure: `Fail; Reduce a random Ability by 1`,
    },
  }],
  findBuildingSite() {
    return this.actor.powerups.matches({incompleteTemplate: this.structureName})[0] ||
      BuildingSite.add({attributes: {incompleteTemplate: this.structureName, foundationId: this.foundationId}, actor: this.actor, activity: this});
  },
  makeProgresss(progress) {
    if (progress === 0) { return }

    let buildingSite = this.findBuildingSite();
    buildingSite.progress += progress;
    if (buildingSite.progress >= buildingSite.cost) {
      this.actor.removePowerup(buildingSite);
      this.actor.removePowerup(buildingSite.foundation);
      Structure.add({template: this.structureName, actor: this.actor, activity: this,
        added({activity, fullName}) {
          activity.info(`🏛️ You built the ${fullName}!`)

          // TODO automate this (and maybe change thresholds)
          activity.info("📈 If there are now 4+ buildings in the settlement, it's a town. Get Milestone XP!");
          activity.info("📈 If there are now 8+ buildings in the settlement, it's a city. Get Milestone XP!");
          activity.info("📈 If there are now 16+ buildings in the settlement, it's a metropolis. Get Milestone XP!");
        },
      });
    } else {
      this.info(`🚧 ${buildingSite.name} is now ${buildingSite.percentage}% complete.`);
    }
  },
  baseProgress() { return this.decision("Payment")?.amount || 1 },
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
