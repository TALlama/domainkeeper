import "./extensions.js";

class PoolElement {
  constructor({sign, sides, value, target}={}) {
    this.sign = sign ?? 1;
    this.sides = sides;
    if (value !== undefined) { this.value = value };
    this.target = target;
    this.length = 1;
  }

  roll({rigged=false}={}) {
    let face;
    if (rigged && Die.rig.length && this.sides.length > 1) {
      face = Math.max(this.min, Math.min(this.max, Die.rig.shift()));
    } else {
      face = this.sides.random();
    }
    return this.value = this.sign * face;
  }
  _firstRoll(opts={}) { if (this.value === undefined) { this.roll(opts) } }

  get _min() { return this.sign * (this.length) }
  get _max() { return this.sign * (this.length * this.size) }

  get range() {
    let min = this._min;
    let max = this._max;
    return (min < max) ? {min, max} : {min: max, max: min};
  }
  get min() { return this.range.min }
  get max() { return this.range.max }

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

  get _min() { return this.value }
  get _max() { return this.value }

  get unsignedDescription() { return Math.abs(this.value).toString() }
  get unsignedSummary() { return this.unsignedDescription }

  static plus(n) { return new Flat(n) }
  static minus(n) { return new Flat(-n) }
}

export class Die extends PoolElement {
  constructor(size, {...opts}={}) {
    super({sides: Array.from({length: size}, (_, i) => i + 1), ...opts});
    this.size = size;
    this._firstRoll(opts);
  }

  get unsignedDescription() { return `d${this.size}` }
  get unsignedSummary() { return Math.abs(this.value).toString() }

  static flatCheck(dc = 11, opts={}) { return new Die(20, {target: dc, rigged: true, ...opts}).succeeded }
  static d4(opts={}) { return new Die(4, opts).value }
  static d6(opts={}) { return new Die(6, opts).value }
  static d8(opts={}) { return new Die(8, opts).value }
  static d10(opts={}) { return new Die(10, opts).value }
  static d12(opts={}) { return new Die(12, opts).value }
  static d20(opts={}) { return new Die(20, opts).value }

  static rig = [];
}

export class DieSet extends PoolElement {
  constructor(length, size, {value, values, keep="all", ...opts}={}) {
    values = DieSet.valuesFor({length, size, value, values});
    super({...opts});
    this.keep = keep;
    this.length = {highest: 1, lowest: 1}[keep] || length;
    this.size = size;
    this.dice = Array.from({length}, n => new Die(size, {...opts, value: values.shift()}));
    this.#updateValue();
  }

  get values() { return this.dice.map(d => d.value) }

  get keepSuffix() { return {highest: "kh", lowest: "kl"}[this.keep] || "" }

  get unsignedDescription() { return `${this.dice.length}d${this.size}${this.keepSuffix}` }
  get unsignedSummary() { return `(${this.dice.map(d => d.unsignedSummary).join(this.keep === "all" ? " + " : " | ")})` }

  roll(opts) { this.dice.forEach(d => d.roll(opts)); return this.#updateValue() }
  #updateValue() {
    if (this.keep === "all") {
      return this.value = this.values.reduce((sum, v) => sum + v, 0);
    } else if (this.keep === "highest") {
      return this.value = this.values.sort((a, b) => b - a)[0];
    } else if (this.keep === "lowest") {
      return this.value = this.values.sort((a, b) => a - b)[0];
    }
  }

  static valuesFor({length, size, value, values}) {
    if (Array.isArray(values)) {
      return values;
    } else if (values === undefined) {
      if (value === undefined) { return [] }
      values = [];
      let remaining = value;
      for (let i = 0; i < length; i++) {
        let dieValue = Math.min(remaining - (length - i - 1), size);
        values.push(dieValue);
        remaining -= dieValue;
      }
      return values;
    } else {
      let remaining = values;
      let each = Math.floor(remaining / length);
      let remainder = remaining - (each * length);
      values = Array.from({length}, () => each);
      values[0] += remainder;
      return values;
    }
  }
}

export class DicePool extends PoolElement {
  constructor({elements, target, ...opts}={}) {
    super({sides: [], target});
    this.elements = elements;
    this._firstRoll(opts);
  }

  #buildString(fn) {
    return this.elements.flatMap((e, index) => {
      return [e.signDescription, fn(e)];
    }).filter(s => s).filter((s, ix) => !(s === "+" && ix === 0)).join(" ");
  }

  get description() { return this.#buildString(e => e.unsignedDescription) }
  get summary() { return this.#buildString(e => e.unsignedSummary) }

  roll({rigged=false, ...opts}={}) {
    if (rigged && DicePool.rig.length) {
      return this.value = Math.max(this.min, Math.min(this.max, DicePool.rig.shift()));
    }
    opts = {rigged, ...opts};
    return this.elements.reduce((sum, e) => sum + e.roll(opts), 0);
  }

  get _min() { return this.elements.reduce((sum, element) => sum + element.min, 0) }
  get _max() { return this.elements.reduce((sum, element) => sum + element.max, 0) }

  get values() { return this.elements.reduce((agg, e) => {
    let v = e.values;
    return (v.length === 1) ? [...agg, ...v] : [...agg, v];
  }, []) }
  
  get value() { return this.elements.reduce((sum, element) => sum + element.value, 0) }
  set value(value) {
    let values = DicePool.valuesFor({str: this.description, value});
    this.elements.forEach((e, index) => e.value = values[index]);
  }

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

  static valuesFor({str, value, values}) {
    if (Array.isArray(values)) { return values }
    if (value === undefined) { return [] }

    let elements = DicePool.parse(str, {values: []}).elements;
    values = elements.map(e => e.min);
    let remaining = value - values.reduce((sum, v) => sum + v, 0);
    elements.forEach((e, index) => {
      let eat = Math.min(e.max - e.min, remaining);
      values[index] += eat;
      remaining -= eat;
    });
    return values;
  }

  static parse(str, {value, values, ...options}={}) {
    values = DicePool.valuesFor({str, value, values});

    let sign = 1;
    let elements = str.split(/\s*([+-])\s*/).flatMap(part => {
      if (part === "") { return [] }
      if (part === "+") { sign = 1; return [] }
      if (part === "-") { sign = -1; return [] }

      let [count, size] = part.split("d");
      let value = values.shift();
      if (!size) { return new Flat(parseInt(count), {sign, value}) }
      if (parseInt(count || 1) === 1) { return new Die(parseInt(size), {sign, value}) }

      let keep = {kh: "highest", kl: "lowest"}[size.match(/(kh|kl)/)?.[1]] || "all";
      return new DieSet(parseInt(count || 1), parseInt(size), {sign, keep, values: value});
    });
    return new this({elements, ...options});
  }

  static rig = [];
}
