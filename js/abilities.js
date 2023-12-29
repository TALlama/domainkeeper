export class Ability {
  static all = "Culture Economy Loyalty Stability".split(" ");

  static previous(from) { return {Stability: "Loyalty", Loyalty: "Economy", Economy: "Culture", Culture: "Stability"}[from] }
  static next(from) { return {Culture: "Economy", Economy: "Loyalty", Loyalty: "Stability", Stability: "Culture"}[from] }
  static get random() { return this.all.random() }
}
