import { Ability } from "../abilities.js";
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
    picked(structureName) { this.decision("Roll").difficultyClassOptions.base = Structure.template(structureName)?.dc },
    mutable: (activity, decision) => activity.decision("Roll").mutable,
  }, {
    name: "Payment",
    options: () => Ability.all,
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
  criticalSuccess() {
    this.info("😂 Everyone rallies to help.");
    this.boost(Ability.random);
    this.success();
  },
  success() {
    this.structureId = Structure.add({template: this.structureName, actor: this.actor, activity: this,
      added({activity, fullName}) { activity.info(`🏛️ You built the ${fullName}!`) },
    }).id;
    
    this.info("📈 If there are now 4+ buildings in the settlement, it's a town. Get Milestone XP!");
    this.info("📈 If there are now 8+ buildings in the settlement, it's a city. Get Milestone XP!");
    this.info("📈 If there are now 16+ buildings in the settlement, it's a metropolis. Get Milestone XP!");
  },
  failure() { this.warning("❌ You fail to build the building") },
  criticalFailure() {
    this.warning("💀 Some workers are killed in a construction accident");
    this.reduce(Ability.random);
    this.failure();
  },
}].map(a => { return {type: "civic", ...a}});
