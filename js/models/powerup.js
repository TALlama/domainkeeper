import { addTransient } from "./utils.js";
import { makeId } from "./with_id.js";
import { withTemplates } from "./with_templates.js";
import { withTraits } from "./with_traits.js";

export class Powerup {
  constructor(properties, holder) {
    addTransient(this, {value: {holder}});

    let {template} = this.init(properties);

    this.type ??= this.constructor.type;
    this.id ??= makeId(this.type, template);
    this.name ??= template;
    this.template ??= template;
    this.traits ??= [];
  }

  setup({actor, powerup, activity}) {}
  added({actor, powerup, activity}) {}

  get holder() { return this.transient.holder }
  set holder(value) { return this.transient.holder = value }

  static add({type, template, attributes, actor, activity, setup, added, makeContext}) {
    const powerup = new type({template, ...(attributes || {})}, actor);
    let context = {powerup, template, actor, activity};
    if (makeContext) { context = makeContext(context) }

    setup && setup(context);
    powerup.setup && powerup.setup(context);

    actor.addPowerup(powerup);
    added && added({...context, fullName: `${powerup.name}${powerup.name === template ? "" : `, a ${template}`}`});
    powerup.added && powerup.added(context);

    return powerup;
  }
}
withTemplates(Powerup, () => []);
withTraits(Powerup);
