import { addTransient } from "./utils.js";
import { withTemplates } from "./with_templates.js";
import { makeId } from "./with_id.js";
import { Ability } from "./abilities.js";
import { ActivityDecision } from "./activity_decision.js";

import { civicTemplates } from "./ability_templates/civic.js";
import { leadershipTemplates } from "./ability_templates/leadership.js";
import { systemTemplates } from "./ability_templates/system.js";

export class Activity {
  constructor(properties, turn) {
    this.log = [];
    addTransient(this, {value: {turn}});

    this.init(properties, {decisions: [{name: "Roll"}, {name: "Outcome"}]});

    // evaluate the template's lazy-loaded properties
    "description".split(" ").forEach(prop =>
      this[prop] && this[prop].call && (this[prop] = this[prop]())
    );

    this.id ||= makeId(`activity`, this.name);

    Object.defineProperty(this, `callbacksEnabled`, {get() {return true}});
  }

  /////////////////////////////////////////////// Associations

  get actor() { return this.domain.actor(this.actorId) }
  get turn() { return this.transient.turn }
  set turn(value) { /* ignore */ }
  get domain() { return this.turn.domain }
  set domain(value) { /* ignore */ }
  
  peerActivities() {
    return "civic system".split(" ").includes(this.type)
      ? []
      : (this.turn.activities || []).filter(e => e.name === this.name) || [];
  }

  /////////////////////////////////////////////// Decisions & Resolution

  get decisions() { return this.transient.decisions }
  set decisions(value) {
    this.transient.decisions = value.map(v => v.constructor === ActivityDecision ? v : new ActivityDecision(v, this));
  }
  decision(name) { return this.decisions.find(d => d.name === name) }

  get resolved() { return this.decisions.all("resolved") }
  
  /////////////////////////////////////////////// Actions

  boost(...abilities) {
    let {by} = abilities[0];
    by && abilities.shift();
    by ??= 1;
    if (by < 0) { return this.reduce({by}, ...abilities) }
    abilities.forEach(ability => {
      this.domain.boost({by}, ability);
      this.info(`📈 Boosted ${ability} by ${by} <small>, to ${this.domain[ability.toLowerCase()]}</small>`);
    });
  }

  reduce(...abilities) {
    let {by} = abilities[0];
    by && abilities.shift();
    by ??= -1;

    if (by > 0) { return this.boost({by}, ...abilities) }
    abilities.forEach(ability => {
      this.domain.boost({by}, ability);
      this.warning(`📉 Reduced ${ability} by ${Math.abs(by)} <small>, to ${this.domain[ability.toLowerCase()]}</small>`);
    });
  }

  addConsumable(attrs, logMessage) {
    this.info(logMessage || `➕ Added ${attrs.name}`);
    this.domain.addConsumable(attrs);
  }

  addFame() {
    this.info("👩🏻‍🎤 Add fame");
    this.domain.addFame();
  }

  addBonusActivity(actor) {
    this.info(`🛟 Added bonus activity for ${actor.name}`);
    actor.bonusActivities += 1;
  }

  requirePayment(properties = {}) {
    let decision = this.decision("Payment");
    if (decision) {
      Object.assign(decision, properties);
    } else {
      this.decisions.push(new ActivityDecision({template: "Payment", ...properties}, this));
    }
  }

  abandonPayment() {
    this.decision("Payment").resolution = "abandoned";
  }

  skipPayment() {
    let payment = this.decision("Payment");
    payment.amount = 0;
    payment.options = [...payment.options, "free"];
    payment.resolution = "free";
  }

  /////////////////////////////////////////////// Logging

  debug(html) { this.log.push({level: "debug", html}) }
  info(html) { this.log.push({level: "info", html}) }
  warning(html) { this.log.push({level: "warning", html}) }
  error(html) { this.log.push({level: "error", html}) }
  
  /////////////////////////////////////////////// Templates

  static get names() { return this._names ||= this.templates.map(s => s.name) }
}
withTemplates(Activity, () => [...systemTemplates, ...leadershipTemplates, ...civicTemplates]);
