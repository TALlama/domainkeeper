import "./extensions.js";

class PoolElement {
  constructor({sign, sides, value, target}={}) {
    this.sign = sign ?? 1;
    this.sides = sides;
    if (value !== undefined) { this.value = value };
    this.target = target;
    this.length = 1;
  }

  roll() { return this.value = this.sign * this.sides.random() }
  _firstRoll() { if (this.value === undefined) { this.roll() } }

  get values() { return [this.value] }
  get diff() { return this.value - this.target }
  get outcome() { return new DicePool({elements: [this], target: this.target}).outcome }
  get succeeded() { return this.outcome === "success" || this.outcome === "criticalSuccess" }
  get failed() { return !this.succeeded }

  get signDescription() { return this.sign > 0 ? "+" : "-" }
  get signIfNegative() { return this.sign < 0 ? "-" : "" }

  get description() { return `${this.signIfNegative}${this.unsignedDescription}` }
  get summary() { return `${this.signIfNegative}${this.unsignedSummary}` }
}

export class Flat extends PoolElement {
  constructor(value, {...opts}={}) {
    super({sides: [value], ...opts});
    this.value ?? this.roll();
  }

  get unsignedDescription() { return Math.abs(this.value).toString() }
  get unsignedSummary() { return this.unsignedDescription }

  static plus(n) { return new Flat(n) }
  static minus(n) { return new Flat(-n) }
}

export class Die extends PoolElement {
  constructor(size, {...opts}={}) {
    super({sides: Array.from({length: size}, (_, i) => i + 1), ...opts});
    this.size = size;
    this._firstRoll();
  }

  get unsignedDescription() { return `d${this.size}` }
  get unsignedSummary() { return Math.abs(this.value).toString() }

  static flatCheck(dc = 11) { return new Die(20, {target: dc}).succeeded }
  static d4() { return new Die(4).value }
  static d6() { return new Die(6).value }
  static d8() { return new Die(8).value }
  static d10() { return new Die(10).value }
  static d12() { return new Die(12).value }
  static d20() { return new Die(20).value }
}

export class DieSet extends PoolElement {
  constructor(length, size, {value, values, ...opts}={}) {
    values = values ?? DieSet.valuesFor(length, size, value);
    super({...opts});
    this.length = length;
    this.size = size;
    this.dice = Array.from({length}, n => new Die(size, {...opts, value: values.shift()}));
    this.value = this.values.reduce((sum, v) => sum + v, 0);
  }

  get values() { return this.dice.map(d => d.value) }

  get unsignedDescription() { return `${this.length}d${this.size}` }
  get unsignedSummary() { return `(${this.dice.map(d => d.unsignedSummary).join(" + ")})` }

  roll() { return this.value = this.dice.reduce((sum, e) => sum + e.roll(), 0) }

  static valuesFor(length, size, value) {
    if (value === undefined) { return [] }

    let values = [];
    let remaining = value;
    for (let i = 0; i < length; i++) {
      let dieValue = Math.min(remaining - (length - i - 1), size);
      values.push(dieValue);
      remaining -= dieValue;
    }
    return values;
  }
}

export class DicePool extends PoolElement {
  constructor({elements, target}={}) {
    super({sides: [], target});
    this.elements = elements;
    this._firstRoll();
  }

  #buildString(fn) {
    return this.elements.flatMap((e, index) => {
      return [e.signDescription, fn(e)];
    }).filter(s => s).filter((s, ix) => !(s === "+" && ix === 0)).join(" ");
  }

  get description() { return this.#buildString(e => e.unsignedDescription) }
  get summary() { return this.#buildString(e => e.unsignedSummary) }

  roll() { return this.elements.reduce((sum, e) => sum + e.roll(), 0) }

  get values() { return this.elements.reduce((agg, e) => {
    let v = e.values;
    return (v.length === 1) ? [...agg, ...v] : [...agg, v];
  }, []) }
  get value() { return this.elements.reduce((sum, element) => sum + element.value, 0) }
  get diff() { return this.value - this.target }
  get outcome() {
    let outcomes = ["criticalFailure", "failure", "success", "criticalSuccess"];
    let index = this.diff >= 0 ? 2 : 1;

    if (this.diff <= -10) { index-- }
    if (this.elements.find(e => e.size === 20 && e.value === 1)) { index-- }

    if (this.diff >= 10) { index++ }
    if (this.elements.find(e => e.size === 20 && e.value === 20)) { index++ }

    index = Math.max(0, Math.min(3, index));
    return outcomes[index];
  }

  get succeeded() { return this.outcome === "success" || this.outcome === "criticalSuccess" }
  get failed() { return !this.succeeded }

  static parse(str, {values, ...options}={}) {
    values = values ?? [];

    let sign = 1;
    let elements = str.split(/\s*([+-])\s*/).flatMap(part => {
      if (part === "") { return [] }
      if (part === "+") { sign = 1; return [] }
      if (part === "-") { sign = -1; return [] }

      let [count, size] = part.split("d");
      let value = values.shift();
      if (!size) { return new Flat(parseInt(count), {sign, value}) }
      if (parseInt(count || 1) === 1) { return new Die(parseInt(size), {sign, value}) }
      return new DieSet(parseInt(count || 1), parseInt(size), {sign, values: value});
    });
    return new this({elements, ...options});
  }
}
