import "../extensions.js";
import { Powerup } from "./powerup.js";
import { Structure } from "./structure.js";

export class BuildingSite extends Powerup {
  constructor(properties, settlement) {
    super(properties, settlement);

    this.cost ??= this.structure.cost ?? 1000;
    this.progress ??= this.foundation?.cost || 0;
    this.foundationId ??= "new";
  }

  get percentage() { return parseInt((this.progress / this.cost * 100).toFixed(1)) }
  get structure() { return new Structure(this.incompleteTemplate) }

  get name() { return `Incomplete ${this.structure.name || this.incompleteTemplate || "Structure"} (${this.progress}/${this.cost ?? 1000})${this.foundationName ? `, from ${this.foundationName}` : ""}` }
  set name(value) { /* ignore */ }

  get settlement() { return this.holder }
  set settlement(value) { return this.holder = value }

  get foundation() { return this.settlement?.powerup(this.foundationId) }
  set foundation(value) { this.foundationId = value?.id }

  get foundationName() { return this.foundationId == "new" ? null : this.foundation?.name }
  set foundationName(value) { /* ignore */ }

  improve(progress, {actor, activity, who="You"}) {
    this.progress += progress;
    if (this.progress >= this.cost) {
      actor.removePowerup(this);
      actor.removePowerup(this.foundation);
      Structure.add({template: this.incompleteTemplate, actor, activity,
        added: ({fullName}) => {
          activity.info(`🏛️ ${who} built the ${fullName}!`)
        },
      });
    } else {
      activity.info(`🚧 ${this.name} is now ${this.percentage}% complete.`);
    }
  }

  static type = "building-site";

  static add({incompleteTemplate, actor, ...opts}) {
    return Powerup.add({type: this, template: "Building Site", incompleteTemplate, actor, ...opts,
      makeContext(ctx) { return {...ctx, settlement: actor, buildingSite: ctx.powerup} },
    });
  }

  static get templates() {
    return [{
      icon: "🚧",
      name: "Building Site",
      summary: "A structure is under construction.",
    }];
  }
}
