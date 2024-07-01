import { describeRoll, mod } from "../helpers.js";
import { nudge } from "../components/event_helpers.js";

import { addTransient, hydrateList } from "./utils.js";
import { Ability } from "./abilities.js";
import { Actor } from "./actor.js";
import { Structure } from "./structure.js";
import { Turn } from "./turn.js";
import { Feat } from "./feat.js";
import { Feature } from "./feature.js";
import { Milestone } from "./milestone.js";
import { Requirement } from "./requirement.js";

let abilitiesStartAt = 2;

export class Domain {
  constructor(properties) {
    addTransient(this, {value: {}});
    hydrateList(this, {name: "leaders", type: Actor});
    hydrateList(this, {name: "settlements", type: Actor});
    hydrateList(this, {name: "turns", type: Turn});
    hydrateList(this, {name: "feats", type: Feat});
    hydrateList(this, {name: "features", type: Feature});

    this.#setDefaults();
    Object.assign(this, properties);

    this.#addDefaultActors();
    this.#addDefaultTurns();
    "size settlements".split(" ").forEach(trigger => this.checkMilestones(trigger));
  }

  /////////////////////////////////////////////// Associations
  get currentTurn() { return this.turns.last() }
  get previousTurn() { const turns = this.turns || []; return turns[turns.length - 2]; }
  get currentActivity() { return this.currentTurn?.currentActivity }

  actor(actorId) { return this.actors.find(a => a.id === actorId) }
  get actors() { return [...(this.settlements || []), ...(this.leaders || [])] }
  set actors(value) { /* ignore */ }
  get availableActors() { return this.actors.filter(a => a.available) }
  set availableActors(value) { /* ignore */ }
  get unavailableActors() { return this.actors.filter(a => a.unavailable) }
  set unavailableActors(value) { /* ignore */ }

  get powerups() { return this.actors.flatMap(a => a.powerups || []) }
  set powerups(v) { /* ignore */ }

  get bonuses() { return [...(this.powerups || []), ...(this.consumables || []), ...(this.feats || [])].flatMap(p => p.bonuses?.map(b => { return {...b, source: p} }) || []) }
  set bonuses(v) { /* ignore */ }
  findBonuses({activity, ability, actorType, ...pattern}) {
    return this.bonuses.matches(pattern)
      .filter(b => {
        return Object.entries({activity, ability, actorType}).all(([prop, value]) => {
          return !b[prop] || b[prop] === value || (Array.isArray(b[prop]) && b[prop].includes(value));
        });
      }).sortBy("-value")
  }
  difficultyClassOptions({activity, decision}) {
    let bonuses = this.findBonuses({
      activity: activity.name,
      ability: activity.roll,
      actorType: activity.actorType,
      type: "dcModifier",
    });

    return {
      options: bonuses.map(b => { return {name: b.label || b.source.name, value: b.value} }),
      selected: bonuses.filter(b => b.enabledByDefault).map(b => b.label || b.source.name),
    }
  }

  get markers() {
    return [
      ...(this.settlements || [])
        .filter(s => s.position)
        .map(s => ({editable: false, position: s.position, icon: s.icon || "🏠"})),
      ...(this.features || [])
        .filter(s => s.position)
        .map(s => ({editable: false, position: s.position, icon: s.icon || "📍"})),
    ];
  }
  set markers(value) { /* ignore */ }

  /////////////////////////////////////////////// Defaults

  #setDefaults() {
    this.name ??= "Anvilania";
    this.level ??= 1;
    this.culture ??= abilitiesStartAt;
    this.economy ??= abilitiesStartAt;
    this.loyalty ??= abilitiesStartAt;
    this.stability ??= abilitiesStartAt;
    this.unrest ??= 0;
    this.size ??= 1;
    this.xp ??= 0;
    this.milestones ??= {};
    this.level ??= 1;

    this.consumables ??= [];
    this.turns ??= [];
  }

  #addDefaultActors() {
    if (this.leaders.length === 0) {
      this.leaders = [];
    }

    if (this.settlements.length === 0) {
      this.settlements = [
        {traits: "Village".split(" "), name: "Capital", icon: "⭐", powerups: [new Structure("Town Hall")]},
      ];
    }
  }

  #addDefaultTurns() {
    this.turns.length || this.#addTurn({name: "Domain Creation"});
    if (this.turns.length === 1 && this.turns[0].activities.all("resolved")) {
      this.newTurn();
    }
  }

  /////////////////////////////////////////////// Events

  decisionPicked(decision, opts={}) {
    this.feats.forEach(feat => feat.decisionPicked && feat.decisionPicked({domain: this, decision, feat, ...opts}));
  }

  /////////////////////////////////////////////// XP & Milestones

  checkMilestones(trigger, activity) {
    activity ??= this.currentActivity;
    Milestone.check(trigger, this).forEach(milestone => {
      this.milestones[milestone.name] = activity?.id || "--the-distant-past--";
      activity?.info(milestone.message);
      this.boost("xp", {by: milestone.xp, activity});
    });
  }

  /////////////////////////////////////////////// Stats

  min(stat) {
    stat = stat.toLocaleLowerCase();

    if ("level size".split(" ").includes(stat)) { return 1 }
    return 0;
  }

  max(stat) {
    return this.maxBase(stat) + this.bonuses.matches({max: stat}).sum("value");
  }

  maxBase(stat) {
    stat = stat.toLocaleLowerCase();

    if (Ability.all.map(a => a.toLocaleLowerCase()).includes(stat)) { return 5 }
    if ("unrest level".split(" ").includes(stat)) { return 20 }
    if ("size".split(" ").includes(stat)) { return 200 }
    return 99999;
  }

  modify(name, {by, activity, boosted, reduced, complete, overflow, ...opts}) {
    let key = name.toLocaleLowerCase();
    let was = this[key];
    let min = this.min(name);
    let max = this.max(name);
    let target = Math.max(min, was + by);
    let overage = target - max;
    let is = this[key] = Math.min(max, target);
    let diff = is - was;
    this.checkMilestones(key, activity);

    let callbackOpts = {name, ...opts, domain: this, diff: Math.abs(is - was), overage, was, is, min, max};
    (diff < 0 && reduced) && reduced({...callbackOpts, diff: Math.abs(diff)});
    (diff > 0 && boosted) && boosted({...callbackOpts, diff: Math.abs(diff)});
    (diff !== 0 && complete) && complete(callbackOpts);
    
    if (overage > 0) {
      overflow && overflow(callbackOpts);

      let xp = overage * 50;
      (activity || this).info(`🛑 ${name} cannot be above ${max}; added ${xp}xp instead`);
      this.xp += xp;
    }
  }

  boost(name, {by=1, ...opts}={}) { this.modify(name, {by, ...opts}) }
  reduce(name, {by=1, ...opts}={}) { this.modify(name, {by: -1 * by, ...opts}) }

  get controlDC() {
    let size = this.size;
    let sizeMod = size < 10 ? 0 : (size < 25 ? 1 : (size < 50 ? 2 : (size < 100 ? 3 : 4)));

    let baseControlDCByLevel = {
      1: 14, // Charter, government, heartland, initial proficiencies, favored land, settlement construction (village)
      2: 15, // Kingdom feat
      3: 16, // Settlement construction (town), skill increase
      4: 18, // Expansion expert, fine living, Kingdom feat
      5: 20, // Ability boosts, ruin resistance, skill increase
      6: 22, // Kingdom feat
      7: 23, // Skill increase
      8: 24, // Experienced leadership +2, Kingdom feat, ruin resistance
      9: 26, // Expansion expert (Claim Hex 3 times/turn), settlement construction (city), skill increase
      10: 27, // Ability boosts, Kingdom feat, life of luxury
      11: 28, // Ruin resistance, skill increase
      12: 30, // Civic planning, Kingdom feat
      13: 31, // Skill increase
      14: 32, // Kingdom feat, ruin resistance
      15: 34, // Ability boosts, settlement construction (metropolis), skill increase
      16: 35, // Experienced leadership +3, Kingdom feat
      17: 36, // Ruin resistance, skill increase
      18: 38, // Kingdom feat
      19: 39, // Skill increase
      20: 40, // Ability boosts, envy of the world, Kingdom feat, ruin resistance
    };

    return sizeMod + baseControlDCByLevel[this.level];
  }

  checkRequirements(...requirements) { return Requirement.evaluate(this, ...requirements) }

  /////////////////////////////////////////////// Logging

  info(...args) {
    let activity = this.currentActivity;
    if (activity) {
      activity.info(...args);
    } else {
      nudge(document.querySelector("domain-sheet"), (activity) => activity.info(...args));
    }
  }

  /////////////////////////////////////////////// Turn Management

  #addTurn(properties = {}) {
    this.turns = [...this.turns, {...properties, number: this.turns.length}];
    return this.turns.last();
  }

  newTurn(properties = {}) {
    this.leaders.forEach(l => l.rollInitiative()); // TODO this too

    let turn = this.#addTurn(properties);
    if (turn.number > 0) {
      let news = turn.addUniqueActivity({name: "News"});
      news.addFame();
      this.powerups.forEach(powerup => powerup.newTurn && powerup.newTurn({domain: this, activity: news, powerup}));
      this.feats.forEach(feat => feat.newTurn && feat.newTurn({domain: this, activity: news, feat}));
    }
    document.querySelector("domain-sheet").saveData();
  }

  activityResolved({activity}) {
    if (activity.actorId === this.currentActorId && activity.actor.activitiesLeft === 0) {
      delete this.currentActorId; // TODO move that into turn
    }

    this.checkMilestones("activity", activity);
  }

  turnResolved({turn}) {
    if (turn.number === 0) { this.endTurn({turn}) }
  }

  endTurn({turn}) {
    if (this.xp >= 1000) {
      turn.addUniqueActivity({name: "Level Up"});
    } else {
      this.turns.last().addActivity({name: "Domain Summary"});
      this.useAllConsumables({useBy: "end-of-turn"});
      this.newTurn();
    }
  }

  /////////////////////////////////////////////// Feat Management

  addFeat(properties = {}) {
    this.feats = [...this.feats, {...properties}];
    return this.feats.last();
  }

  hasFeat(name) { return this.findFeats({name}).length > 0 }
  findFeats(pattern) { return this.feats.matches(pattern) }

  /////////////////////////////////////////////// Features

  addFeature(properties = {}) {
    this.features = [...this.features, {...properties}];
    return this.features.last();
  }

  findFeatures(pattern) { return this.features.matches(pattern) }
  featuresAt([centerX, centerY], {find={}, deltaX=2, deltaY=5}={}) {
    return this.findFeatures(find).filter(f => {
      let [x, y] = f.position || [];
      return Math.abs(x - centerX) <= deltaX && Math.abs(y - centerY) <= deltaY;
    });
  }

  /////////////////////////////////////////////// Consumable Management

  findConsumables(pattern) { return this.consumables.matches(pattern) }

  addConsumable(attrs) {
    this.consumables.push({id: crypto.randomUUID(), name: "Consumable", description: "?", useBy: "end-of-turn", ...attrs});
  }

  useConsumable(pattern) {
    let index = this.consumables.findIndex(c => Object.matches(c, pattern));
    return (index > -1) ? this.consumables.splice(index, 1)[0] : null;
  }

  useAllConsumables(pattern) {
    this
      .findConsumables(pattern)
      .forEach(consumable => this.useConsumable({id: consumable.id}));
  }

  addFame({activity} = {}) {
    let existing = this.findConsumables({name: "Fame"});
    if (existing.length < 3) {
      this.addReroll({name: "Fame", useBy: "end-of-time"});
    } else {
      (activity || this).info(`👨🏻‍🎤 Cannot have more than three Fame; added 100xp instead`);
      this.xp += 100;
    }
  }

  addReroll(attrs={}) {
    let description = attrs.description || `Reroll ${describeRoll(attrs)}`;
    this.addConsumable({action: "reroll", description, ...attrs});
  }

  addRollBonus({value, type, activity, ability, actorType, bonus, action, description, ...attrs}) {
    value = value ?? 1;
    type = type ?? "circumstance";
    bonus = {value, type, activity, ability, actorType, ...bonus};

    action = action ?? "roll-bonus";
    description = description ?? `${mod(value)} ${describeRoll(bonus)} (${type})`;
    this.addConsumable({action, description, bonuses: [bonus], ...attrs});
  }

  addTrade({reduce, boost, ...attrs}) {
    let description = attrs.description || `Trade ${reduce} for ${boost}`;
    this.addConsumable({action: "trade", description, reduce, boost, ...attrs});
  }

  addCriticalFailureProtection({activity, ...attrs}) {
    this.addConsumable({action: "criticalFailureProtection", description: `Ignore CritFail in ${activity}`, activity, ...attrs});
  }
}
