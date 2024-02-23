import "../extensions.js";
import { Powerup } from "./powerup.js";
import { Structure } from "./structure.js";

export class BuildingSite extends Powerup {
  constructor(properties, settlement) {
    super(properties, settlement);

    this.cost ??= this.structure.cost ?? 1000;
    this.progress ??= this.foundation?.cost || 0;
  }

  get percentage() { return parseInt((this.progress / this.cost * 100).toFixed(1)) }
  get structure() { return new Structure(this.incompleteTemplate) }

  get name() { return `Incomplete ${this.structure.name || this.incompleteTemplate || "Structure"} (${this.progress}/${this.cost ?? 1000})${this.foundationName ? `, from ${this.foundationName}` : ""}` }
  set name(value) { /* ignore */ }

  get settlement() { return this.holder }
  set settlement(value) { return this.holder = value }

  get foundation() { return this.settlement?.powerup(this.foundationId) }
  set foundation(value) { this.foundationId = value?.id }

  get foundationName() { return this.foundation?.name }
  set foundationName(value) { /* ignore */ }

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
