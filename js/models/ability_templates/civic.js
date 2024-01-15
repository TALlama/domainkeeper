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
    this.decision("Contribution").amount = {
      Village: -1,
      Town: -2,
      City: -3,
      Metropolis: -4,
    }[this.actor.type] || -1;
  },
}, {
  icon: "🚧",
  name: "Build Structure",
  summary: "Construct something in this settlement that will have long-term benefits",
  description: () => `Add building's cost to the DC`,
  decisions: [{
    name: "Pick a structure",
    description: "Choose a structure you want to build.",
    saveAs: "structureName",
    options: () => new AvalableStructures().names,
    groupOptionsBy: structureName => `Level ${Structure.template(structureName).level}`,
    displayValue: structureName => `<structure-description name="${structureName}"></structure-description>`,
    mutable: (activity, decision) => activity.decision("Roll").mutable,
  }, {
    name: "Roll",
    options: ["Economy"]
  }, {
    name: "Outcome",
    summaries: {
      criticalSuccess: `Build it; Boost a random Ability by 1`,
      success: `Build it`,
      failure: `Fail`,
      criticalFailure: `Fail; Reduce a random Ability by 1`,
    },
  }, {
    name: "Payment",
    options: () => Ability.all,
  }],
  criticalSuccess() {
    this.info("😂 Everyone rallies to help.");
    this.boost(Ability.random);
    this.success();
  },
  success() {
    Structure.add({structureName: this.structureName, settlement: this.actor, activity: this,
      built({activity, fullName}) { activity.info(`🏛️ You built the ${fullName}!`) },
    });
    
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
