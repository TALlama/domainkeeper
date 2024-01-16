export class Powerup {
  constructor(properties) {
    let [templateName, props] = ("string" === typeof properties) ? [properties, {}] : [properties.templateName, properties];

    Object.assign(this, this.constructor.template(templateName));
    Object.assign(this, properties);

    this.type ??= this.constructor.type;
    this.id ??= `${this.type}-${templateName}-${crypto.randomUUID()}`;
    this.templateName ??= templateName;
  }

  setup({actor, powerup, activity}) {}
  added({actor, powerup, activity}) {}

  static add({type, templateName, actor, activity, setup, added, makeContext}) {
    let powerup = new type(templateName);
    let context = {templateName, actor, activity};
    if (makeContext) { context = makeContext(context) }

    setup && setup(context);
    powerup.setup && powerup.setup(context);

    actor.powerups.push(powerup);
    added && added({...context, fullName: `${powerup.name}${powerup.name === templateName ? "" : `, a ${templateName}`}`});
    powerup.added && powerup.added(context);

    return powerup;
  }
}
