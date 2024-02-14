import "../extensions.js";
import { Powerup } from "./powerup.js";
import { Structure } from "./structure.js";

export class BuildingSite extends Powerup {
  constructor(properties) {
    console.log(`Built BuildingSite with ${JSON.stringify(properties)}`);
    super(properties);

    this.cost ??= this.structure.cost ?? 1000;
    this.progress ??= 0;
  }

  get percentage() { return parseInt((this.progress / this.cost * 100).toFixed(1)) }
  get structure() { return new Structure(this.incompleteTemplate) }

  get name() { return `Incomplete ${this.structure.name || this.incompleteTemplate || "Structure"} (${this.progress}/${this.cost ?? 1000})` }
  set name(value) { /* ignore */ }

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
