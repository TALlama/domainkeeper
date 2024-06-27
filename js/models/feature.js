import { addTransient } from "./utils.js";
import { withTemplates } from "./with_templates.js";
import { withTraits } from "./with_traits.js";
import { makeId } from "./with_id.js";

export class Feature {
  constructor(properties, domain) {
    addTransient(this, {value: {domain}});

    let defaults = {};
    this.init(properties, defaults);

    // evaluate the template's lazy-loaded properties
    "".split(" ").forEach(prop =>
      this[prop] && this[prop].call && (this[prop] = this[prop]())
    );

    this.id ||= makeId(`feat`, this.name);
    this.traits ??= [];
  }

  /////////////////////////////////////////////// Associations

  get domain() { return this.domain }
  set domain(value) { /* ignore */ }
  
  /////////////////////////////////////////////// Actions

  added({domain, activity, turn}) {}
  newTurn({domain, activity, turn}) {}
  
  /////////////////////////////////////////////// Templates

  static get names() { return this._names ||= this.templates.map(s => s.name) }
}
withTemplates(Feature, () => [{
  icon: "🛣️",
  name: "Road",
  traits: ["Transportation"],
}, {
  icon: "⛵",
  name: "Canal",
  traits: ["Transportation"],
}, {
  icon: "🌉",
  name: "Bridge",
  traits: ["Transportation"],
}, {
  icon: "🌱",
  name: "Irrigation",
}, {
  icon: "🏰",
  name: "Fort",
  traits: ["Defensive"],
}]);
withTraits(Feature);
