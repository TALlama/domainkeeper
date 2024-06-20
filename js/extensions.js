/* Object extensions */
Object.matches = Object.matches || function(object, pattern) {
  return Object.keys(pattern).reduce((all, key) => all && (pattern[key] === object[key]), true);
};

/* Array extensions */
Array.prototype.random = Array.prototype.random || function() { return this[Math.floor((Math.random()*this.length))] };
Array.prototype.shuffle = Array.prototype.shuffle || function() { return this.sortBy(o => Math.random()) };
Array.prototype.first = Array.prototype.first || function() { return this[0] }
Array.prototype.last = Array.prototype.last || function() { return this[this.length - 1] }
Array.prototype.findLast = Array.prototype.findLast || function(predicate) { return this[this.findLastIndex(predicate)] };
Array.prototype.findLastIndex = Array.prototype.findLastIndex || function(predicate) {
  for(let ix = length - 1; ix >= 0; --ix) {
    if (predicate(this[ix], ix, this)) return ix;
  }
}
Array.prototype.all = Array.prototype.all || function(fn, onEmpty = true) { return this.length === 0 ? onEmpty : this.reduce((all, item) => all && (fn.call ? fn(item) : item[fn]), true) };
Array.prototype.sum = Array.prototype.sum || function(fn, seed = 0) { fn ||= (i) => i; return this.reduce((total, item) => total + (fn.call ? fn(item) : item[fn]), seed) };
Array.prototype.count = Array.prototype.count || function(fn) { return this.filter(fn).length }
Array.prototype.toDictionary = Array.prototype.toDictionary || function(fn) {
  let retval = {};
  this.forEach((element, ix, arr) => {
    let [key, value] = fn ? fn(element, ix, arr) : element;
    retval[key] = value;
  });
  return retval;
}
Array.prototype.sortBy = Array.prototype.sortBy || function(attr) {
  if (attr[0] == "-") { return this.sortBy(attr.substr(1)).reverse() }

  return this.sort((a, b) => {
    let aVal = attr.call ? attr(a) : a[attr];
    let bVal = attr.call ? attr(b) : b[attr];
    return aVal === bVal ? 0 : (aVal > bVal ? 1 : -1);
  })
};
Array.prototype.groupBy = Array.prototype.groupBy || function(attr) {
  return this.reduce((grouped, item, index, arr) => {
    let key = attr.call ? attr(item, index, arr) : item[attr];
    grouped[key] ??= [];
    grouped[key].push(item);
    return grouped;
  }, {});
};
Array.prototype.matches = Array.prototype.matches || function(pattern) {
  return this.filter(object => Object.matches(object, pattern));
}
Array.eql = Array.eql || function(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((e, ix) => b[ix] === e);
}

/* String extentions */
String.prototype.escapeHtml = String.prototype.escapeHtml || function() {
  try {
    const el = document.createElement("div");
    el.innerText = this;
    return el.innerHTML;
  } catch (e) {
    return "--- ERROR: CANNOT ESCAPE HTML ---";
  }
}

class Die {
  constructor(sides, {value, target}) {
    this.sides = Array.from({length: sides}, (_, i) => i + 1);
    this.target = target;
    this.value = value || this.roll();
  }

  roll() { return this.value = this.sides.random() }

  get diff() { return this.value - this.target }
  get outcome() {
    let outcomes = ["criticalFailure", "failure", "success", "criticalSuccess"];
    let index = 0;

    let diff = this.diff;
    if (diff > -10) { index++ }
    if (diff >= 0) { index++ }
    if (diff >= 10) { index++ }
    if (this.value === 1) { index-- }
    if (this.value === 20) { index++ }

    index = Math.max(0, Math.min(3, index));
    return outcomes[index];
  }

  get succeeded() { return this.outcome === "success" || this.outcome === "criticalSuccess" }
  get failed() { return !this.succeeded }

  static flatCheck(dc) { return new Die(20, {target: dc}).succeeded }
}
