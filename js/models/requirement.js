export class Requirement {
  static evaluate(model, ...requirements) {
    return new AndRequirement(model, ...requirements.map(req => {
      let reqClass = ImpossibleRequirement;

      if (req?.feat) {
        reqClass = FeatRequirement;
      } else if (req?.maxAbility) {
        reqClass = MaxStatRequirement;
      } else if (req?.ability === "Level") {
        reqClass = LevelRequirement;
      } else if (req?.ability) {
        reqClass = StatRequirement;
      }

      return new reqClass(model, req)
    }));
  }

  constructor(model, opts={}) {
    this.model = model;
    this.opts = opts;
  }

  set met(value) { this._met = value; }
  get met() { this.#evaluateOnce(); return !!this._met; }
  get unmet() { return !this.met; }

  set description(value) { this._description = value; }
  get description() { this.#evaluateOnce(); return this._description || JSON.stringify(this.opts) }

  #evaluated = false;
  #evaluateOnce() { (this.#evaluated) || this.evaluate(); }
}

class AndRequirement extends Requirement {
  constructor(model, ...children) {
    super(model);
    this.children = children;
  }

  get met() { return this.children.all(req => req.met) }
  get description() { return this.children.map(req => req.description).join("\n") }
}

export class ImpossibleRequirement extends Requirement {
  evaluate() {
    this.description = `Unknown requirement: ${JSON.stringify(this.opts)}`;
  }
}

class FeatRequirement extends Requirement {
  evaluate() {
    let feat = this.opts.feat;
    this.description = `${feat} feat`
    this.met = this.model.hasFeat(feat);
  }
}

class StatRequirement extends Requirement {
  evaluate() {
    let ability = this.opts.ability;
    let minimum = this.opts.value;
    let current = this.model[ability.toLocaleLowerCase()];
    this.description = this.describe(ability, minimum, current);
    this.met = current >= minimum;
  }

  describe(ability, minimum, current) {
    return `${ability} must be ${minimum} or higher`
  }
}

class LevelRequirement extends StatRequirement {
  describe(ability, minimum, current) {
    return `Requires level ${minimum}`
  }
}

class MaxStatRequirement extends Requirement {
  evaluate() {
    let ability = this.opts.maxAbility;
    let minimum = this.opts.value;
    let current = this.model.max(ability);
    this.description = `${ability} max must be ${minimum} or higher`
    this.met = current >= minimum;
  }
}
