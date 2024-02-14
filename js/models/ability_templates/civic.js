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
  findBuildingSite() {
    return this.actor.powerups.matches({incompleteTemplate: this.structureName})[0] ||
      BuildingSite.add({attributes: {incompleteTemplate: this.structureName}, actor: this.actor, activity: this});
  },
  makeProgresss(progress) {
    if (progress === 0) { return }

    let buildingSite = this.findBuildingSite();
    buildingSite.progress += progress;
    if (buildingSite.progress >= buildingSite.cost) {
      this.actor.removePowerup(buildingSite);
      Structure.add({template: this.structureName, actor: this.actor, activity: this,
        added({activity, fullName}) {
          activity.info(`🏛️ You built the ${fullName}!`)

          activity.info("📈 If there are now 4+ buildings in the settlement, it's a town. Get Milestone XP!");
          activity.info("📈 If there are now 8+ buildings in the settlement, it's a city. Get Milestone XP!");
          activity.info("📈 If there are now 16+ buildings in the settlement, it's a metropolis. Get Milestone XP!");
        },
      });
    } else {
      this.info(`🚧 ${buildingSite.name} is now ${buildingSite.percentage}% complete.`);
    }
  },
  baseProgress() { return 1 },  // TODO make this dynamic
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
