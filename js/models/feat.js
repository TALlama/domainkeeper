import { addTransient } from "./utils.js";
import { withTemplates } from "./with_templates.js";
import { withTraits } from "./with_traits.js";
import { makeId } from "./with_id.js";

import { allFeats } from "./feat_templates/all_feats.js";

export class Feat {
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

  onPick({domain, activity, turn}) {}
  onRoll({domain, activity, turn, roll}) {}
  newTurn({domain, activity, turn}) {}
  
  /////////////////////////////////////////////// Templates

  static get names() { return this._names ||= this.templates.map(s => s.name) }
}
withTemplates(Feat, () => [...allFeats]);
withTraits(Feat);
