import { Ability } from "./abilities.js";
import { Structure } from "./structure.js";
import { AvalableStructures } from "../components/available_structures.js";
import { StructureDescription } from "../components/structure_description.js";

let callOrReturn = (value) => { return value?.call ? value.call(this, this) : value };

class ActivityDecision {
  #activity;

  constructor(name, activity) {
    this.name = name;
    this.#activity = activity;

    let single = this.resolutionAccessor = {setup: "parameter", roll: "usedAbility", outcome: "outcome", pay: "payment"}[name] || name;
    let plural = this.optionsAccessor = {setup: "parameters", roll: "abilities", outcome: "outcomes", pay: "payments"}[name] || `${name}s`;
    let capSingle = `${single[0].toUpperCase()}${single.substr(1)}`;
    let capPlural = `${plural[0].toUpperCase()}${plural.substr(1)}`;
    
    // TODO all this metaprogramming should be decision-first, not activity-first
    activity[`summaryFor${capSingle}`] ||= (value) => (activity[`summariesFor${capPlural}`][value] || "");
    activity[`summariesFor${capPlural}`] ||= {};
    activity[`${single}Summary`] || Object.defineProperty(activity, `${single}Summary`, {
      get() { return this[`summaryFor${capSingle}`](this[single]) },
    });

    activity[`displayFor${capSingle}`] ||= (value) => value;
    this.displayFor = (value) => activity[`displayFor${capSingle}`](value);
    activity[`displayFor${capPlural}`] || Object.defineProperty(activity, `displayFor${capPlural}`, {
      get() { return this[plural].map(value => this[`displayFor${capSingle}`](value)) }
    });
    Object.defineProperty(this, `displays`, {get() { return activity[`displayFor${capPlural}`] }});
    activity[`${single}Display`] || Object.defineProperty(activity, `${single}Display`, {
      get() { return this[`displayFor${capSingle}`](this[single]) },
    });
    Object.defineProperty(this, `display`, {get() { return activity[`${single}Display`] }});

    (activity[`valueFor${capSingle}`] ||= (value) => value);
    this.valueFor = (value) => activity[`valueFor${capSingle}`](value);
    activity[`valueFor${capPlural}`] || Object.defineProperty(activity, `valueFor${capPlural}`, {
      get() { return this[plural].map(value => this[`valueFor${capSingle}`](value)) },
    });
    Object.defineProperty(this, `values`, {get() { return activity[`valueFor${capPlural}`] }});
    activity[`${single}Value`] || Object.defineProperty(activity, `${single}Value`, {
      get() { return this[`valueFor${capSingle}`](this[single]) },
      set(value) { this[single] = this[plural].find(option => this[`valueFor${capSingle}`](option) === value) },
    });
    Object.defineProperty(this, `value`, {get() { return activity[`${single}Value`] }});

    Object.defineProperty(this, `dictionary`, {get() { return activity[`dictionaryOf${capPlural}`] }});
    activity[`dictionaryOf${capPlural}`] || Object.defineProperty(activity, `dictionaryOf${capPlural}`, {
      get() { return this[plural].toDictionary(value => [this[`valueFor${capSingle}`](value), this[`displayFor${capSingle}`](value)]) }
    });

    activity[`_${plural}`] = activity[plural];
    Object.defineProperty(activity, plural, {
      configurable: true,
      get() { return callOrReturn(this[`_${plural}`]) },
      set(value) { this[`_${plural}`] = value },
    });
    
    
    let decision = this;
    let callback = `${single}Picked`;
    Object.defineProperty(activity, single, {
      configurable: true,
      get() { return this[`_${single}`] },
      set(value) {
        if (![...decision.options, null, undefined].includes(value)) { throw TypeError(`Canot set ${single} to ${value}; try one of ${JSON.stringify(decision.options)}`) }
        this[`_${single}`] = value
        this[callback]?.call(this, value)
      },
    });
  }

  get options() { return callOrReturn(this.#activity[this.optionsAccessor]) || [] }
  set options(value) { /* ignore */ }
  get resolution() { return this.#activity[this.resolutionAccessor] }
  set resolution(value) { this.#activity[this.resolutionAccessor] = value }

  get resolved() { return this.options.length === 0 || !!this.resolution }
}

export class Activity {
  constructor(properties) {
    this.log = [];

    let [templateName, props] = properties.name ? [properties.name, properties] : [properties, {}];
    props = {
      decisionNames: "setup roll outcome pay".split(" "),
      abilities: Ability.all,
      outcomes: "criticalSuccess success failure criticalFailure".split(" "),
      xdisplayForOutcomes: { // TODO why does removing the x break everything?
        criticalSuccess: "Critical Success",
        success: "Success",
        failure: "Failure",
        criticalFailure: "Critical Failure",
      },
      ...Activity.template(templateName),
      ...props};
    Object.assign(this, props);

    // evaluate the template's lazy-loaded properties
    "description".split(" ").forEach(prop => this[prop] && (this[prop] = this[prop]()));

    this.name ||= templateName;
    this.id ||= crypto.randomUUID();
  }

  // TODO how can we do this without hitting the DOM?
  get domainSheet() { return document.querySelector("domain-sheet") }
  get actor() { return this.domainSheet.actor(this.actorId) }

  get decisionNames() { return this.decisions ? Object.keys(this.decisions) : undefined }
  set decisionNames(value) {
    this.decisions = value.toDictionary(v => [v, new ActivityDecision(v, this)])
  }

  get resolved() { return Object.values(this.decisions).reduce((all, d) => all && d.resolved, true) }
  
  outcomePicked(outcome) {
    this.info(`Outcome: ${this.displayForOutcome(outcome)}`);
    this[outcome]?.call(this);
  }

  debug(html) { this.log.push({level: "debug", html}) }
  info(html) { this.log.push({level: "info", html}) }
  warning(html) { this.log.push({level: "warning", html}) }
  error(html) { this.log.push({level: "error", html}) }
  
  static template(name) { return this.templates.find(s => s.name === name) }
  
  static get names() { return this._names ||= this.templates.map(s => s.name) }
  static get templates() { return this._templates ||= [
    {
      type: "leadership",
      name: "Claim Hex",
      abilities: ["A", "B"],
    },
    {
      type: "civic",
      icon: "💰",
      name: "Contribute",
      summary: "This settlement is hard at work.",
      decisionNames: ["setup"],
      options: () => Ability.all,
      optionPicked: (option) => this.boost(ability),
    },
    {
      type: "civic",
      icon: "🚧",
      name: "Build Structure",
      summary: "Construct something in this settlement that will have long-term benefits",
      description: () => `Add building's cost to the DC`,
      parameters: () => new AvalableStructures().names,
      displayForParameter: structureName => `<structure-description name="${structureName}"></structure-description>`,
      abilities: ["Economy"],
      payments: () => Ability.all,
      summariesForOutcomes: {
        criticalSuccess: `Build it; Boost a random Ability by 1`,
        success: `Build it`,
        failure: `Fail`,
        criticalFailure: `Fail; Reduce a random Ability by 1`,
      },
      criticalSuccess() {
        this.info("😂 Everyone rallies to help.");
        this.boost(Ability.random);
        this.success();
      },
      success() {
        this.info(`🏛️ You built the ${this.parameterValue}!`);
        this.actor.powerups.push(new Structure(this.parameterValue));

        this.info("📈 If there are now 2+ buildings in the settlement, it's a town. Get Milestone XP!");
        this.info("📈 If there are now 4+ buildings in the settlement, it's a city. Get Milestone XP!");
        this.info("📈 If there are now 8+ buildings in the settlement, it's a metropolis. Get Milestone XP!");
      },
      failure() { this.warning("❌ You fail to build the building") },
      criticalFailure() {
        this.warning("💀 Some workers are killed in a construction accident");
        this.reduce(Ability.random);
        this.failure();
      },
    },
  ]}
}
window.Activity = Activity;

import { Eris } from "../eris.js";
Eris.test("Activity", makeSure => {
  makeSure.it("remembers the properties given to it", ({assert}) => {
    let activity = new Activity({name: "Dance", prop: "value"});
    assert.equals(activity.name, "Dance");
    assert.equals(activity.prop, "value");
  });
  makeSure.it("pulls properties from the template", ({assert}) => {
    let activity = new Activity("Claim Hex");
    assert.equals(activity.name, "Claim Hex");
    assert.equals(activity.abilities, ["A", "B"]);
  });

  makeSure.describe("id", makeSure => {
    makeSure.it("gets a default if not set", ({assert}) => {
      let activity = new Activity("Dance");
      assert.defined(activity.id);
    });
    makeSure.it("accepts a property", ({assert}) => {
      let activity = new Activity({name: "Dance", id: "etcetc"});
      assert.equals(activity.id, "etcetc");
    });
  });

  makeSure.describe("description", makeSure => {
    makeSure.it("defaults to null", ({assert}) => {
      let activity = new Activity("Dance");
      assert.equals(activity.description, undefined);
    });
    makeSure.it("accepts a function parameter", ({assert}) => {
      let activity = new Activity({name: "Dance", description: () => "etcetc"});
      assert.equals(activity.description, "etcetc");
    });
  });

  makeSure.describe("log", makeSure => {
    makeSure.let("activity", () => new Activity("Dance"));

    makeSure.it("has no log entries by default, but can add them", ({assert, activity}) => {
      assert.equals(activity.log.length, 0);
    });

    makeSure.it("can log debug text to help programmers find bugs", ({assert, activity}) => {
      activity.debug("Internal state: THX-1138");
      assert.jsonEquals(activity.log, [{level: "debug", html: "Internal state: THX-1138"}]);
    });

    makeSure.it("can log informative text to track what happened", ({assert, activity}) => {
      activity.info("Something happened that we want to remember");
      assert.jsonEquals(activity.log, [{level: "info", html: "Something happened that we want to remember"}]);
    });

    makeSure.it("can log warning text to highlight bad stuf", ({assert, activity}) => {
      activity.warning("Pirates attacked");
      assert.jsonEquals(activity.log, [{level: "warning", html: "Pirates attacked"}]);
    });

    makeSure.it("can log error text to explain why something didn't work", ({assert, activity}) => {
      activity.error("You're all out of spoons");
      assert.jsonEquals(activity.log, [{level: "error", html: "You're all out of spoons"}]);
    });
  });

  makeSure.describe("parameters", makeSure => {
    makeSure.let("activity", () => new Activity({name: "Dance", parameters: ["A", "B", "C"]}));

    makeSure.it("accepts a property", ({assert, activity}) => {
      assert.equals(activity.parameters, ["A", "B", "C"]);
    });

    makeSure.it("accepts a property that's a function", ({assert}) => {
      let activity = new Activity({name: "Dance", parameters: () => ["1", "2", "3"]})
      assert.equals(activity.parameters, ["1", "2", "3"]);
    });

    makeSure.it("exposes an accessor for the parameter", ({assert, activity}) => {
      let callbacks = [];
      activity.parameterPicked = (parameter) => callbacks.push(parameter);
      activity.parameter = null;
      activity.parameter = "B";
      assert.equals(callbacks, [null, "B"]);
      assert.equals(activity.parameter, "B");
    });

    makeSure.it("causes an exception if you try to set something that's not an option", ({assert, activity}) => {
      assert.expectError(() => activity.parameter = "D", "TypeError");
    });

    makeSure.describe("internal values", makeSure => {
      makeSure.it("exposes accessors for the values", ({assert, activity}) => {
        assert.equals(activity.valueForParameter("A"), "A");
        assert.equals(activity.valueForParameters, ["A", "B", "C"]);
      });

      makeSure.it("can be set via property", ({assert}) => {
        let activity = new Activity({name: "Dance", parameters: ["A", "B"], valueForParameter: (param) => `1-${param}`});
        
        assert.equals(activity.valueForParameter("A"), "1-A");
        assert.equals(activity.valueForParameters, ["1-A", "1-B"]);
        assert.jsonEquals(activity.dictionaryOfParameters, {"1-A": "A", "1-B": "B"});

        assert.equals(activity.decisions.setup.valueFor("A"), "1-A");
        assert.equals(activity.decisions.setup.values, ["1-A", "1-B"]);
        assert.jsonEquals(activity.decisions.setup.dictionary, {"1-A": "A", "1-B": "B"});
      });

      makeSure.it("exposes an accessor for the current display value", ({assert}) => {
        let activity = new Activity({name: "Dance", parameters: ["A", "B"], valueForParameter: (param) => param ? `1-${param}` : undefined});
        assert.equals(activity.parameterValue, undefined);
        
        activity.parameter = "A";
        assert.equals(activity.parameterValue, "1-A");

        activity.parameterValue = "1-B";
        assert.equals(activity.parameter, "B");
        assert.equals(activity.parameterValue, "1-B");
      });
    });

    makeSure.describe("display values", makeSure => {
      makeSure.it("exposes accessors for the displays", ({assert, activity}) => {
        assert.equals(activity.displayForParameter("A"), "A");
        assert.equals(activity.displayForParameters, ["A", "B", "C"]);
      });

      makeSure.it("can be set via property", ({assert}) => {
        let activity = new Activity({name: "Dance", parameters: ["A", "B"], displayForParameter: (param) => param?.toLowerCase()});
        assert.equals(activity.displayForParameter("A"), "a");
        assert.equals(activity.displayForParameters, ["a", "b"]);
        assert.jsonEquals(activity.dictionaryOfParameters, {A: "a", B: "b"});
      });

      makeSure.it("exposes an accessor for the current display value", ({assert}) => {
        let activity = new Activity({name: "Dance", parameters: ["A", "B"], displayForParameter: (param) => param?.toLowerCase()});
        assert.equals(activity.parameterDisplay, undefined);
        
        activity.parameter = "A";
        assert.equals(activity.parameterDisplay, "a");
      });
    });

    makeSure.describe("value summaries", makeSure => {
      makeSure.it("exposes accessors for the summaries", ({assert, activity}) => {
        assert.equals(activity.summaryForParameter("A"), "");
        assert.jsonEquals(activity.summariesForParameters, {});
      });

      makeSure.it("can be set via property", ({assert}) => {
        let activity = new Activity({name: "Dance", parameters: ["A", "B"], summariesForParameters: {A: "eh!", B: "🐝"}});
        assert.equals(activity.summaryForParameter("A"), "eh!");
        assert.equals(activity.summaryForParameter("B"), "🐝");
        assert.equals(activity.summaryForParameter("C"), "");
      });
    });
  });

  makeSure.describe("abilities", makeSure => {
    makeSure.let("activity", () => new Activity({name: "Dance", abilities: ["A", "B", "C"]}));

    makeSure.it("gets defaults if not set", ({assert}) => {
      let activity = new Activity("Dance");
      assert.equals(activity.abilities, Ability.all);
    });

    makeSure.it("accepts a property", ({assert, activity}) => {
      assert.equals(activity.abilities, ["A", "B", "C"]);
    });

    makeSure.it("accepts a property that's a function", ({assert}) => {
      let activity = new Activity({name: "Dance", abilities: () => ["1", "2", "3"]})
      assert.equals(activity.abilities, ["1", "2", "3"]);
    });

    makeSure.it("exposes an accessor for the usedAbility", ({assert, activity}) => {
      let callbacks = [];
      activity.usedAbilityPicked = (parameter) => callbacks.push(parameter);
      activity.usedAbility = null;
      activity.usedAbility = "B";
      assert.equals(callbacks, [null, "B"]);
      assert.equals(activity.usedAbility, "B");
    });

    makeSure.it("causes an exception if you try to set something that's not an option", ({assert, activity}) => {
      assert.expectError(() => activity.usedAbility = "D", "TypeError");
    });
  });

  makeSure.describe("outcomes", makeSure => {
    makeSure.let("activity", () => new Activity({name: "Dance"}));

    makeSure.it("gets defaults if not set", ({assert, activity}) => {
      assert.equals(activity.outcomes, ["criticalSuccess", "success", "failure", "criticalFailure"]);
    });

    makeSure.it("accepts a property", ({assert}) => {
      let activity = new Activity({name: "Dance", outcomes: ["A", "B", "C"]});
      assert.equals(activity.outcomes, ["A", "B", "C"]);
    });

    makeSure.it("accepts a property that's a function", ({assert}) => {
      let activity = new Activity({name: "Dance", outcomes: () => ["1", "2", "3"]})
      assert.equals(activity.outcomes, ["1", "2", "3"]);
    });

    makeSure.it("exposes an accessor for the outcome, which calls outcome-callacks by default", ({assert, activity}) => {
      let callbacks = {criticalSuccess: 0, success: 0, failure: 0, criticalFailure: 0};
      activity.criticalSuccess = () => callbacks.criticalSuccess++;
      activity.success = () => callbacks.success++;
      activity.failure = () => callbacks.failure++;
      activity.criticalFailure = () => callbacks.criticalFailure++;

      activity.outcome = "criticalSuccess";
      assert.equals(callbacks.criticalSuccess, 1);
      assert.equals(activity.outcome, "criticalSuccess");

      activity.outcome = "success";
      assert.equals(callbacks.success, 1);
      assert.equals(activity.outcome, "success");

      activity.outcome = "failure";
      assert.equals(callbacks.failure, 1);
      assert.equals(activity.outcome, "failure");

      activity.outcome = "criticalFailure";
      assert.equals(callbacks.criticalFailure, 1);
      assert.equals(activity.outcome, "criticalFailure");

      activity.outcome = null;
      assert.equals(activity.outcome, null);
    });

    makeSure.it("causes an exception if you try to set something that's not an option", ({assert, activity}) => {
      assert.expectError(() => activity.outcome = "boom", "TypeError");
    });
  });

  makeSure.describe("decision", makeSure => {
    makeSure.describe("names", makeSure => {
      makeSure.it("gets defaults if not set", ({assert}) => {
        let activity = new Activity("Dance");
        assert.equals(activity.decisionNames, ["setup", "roll", "outcome", "pay"]);
      });
      makeSure.it("accepts a property", ({assert}) => {
        let activity = new Activity({name: "Dance", decisionNames: ["foo", "bar"]});
        assert.equals(activity.decisionNames, ["foo", "bar"]);
      });
    });

    makeSure.describe("default options for decisions", makeSure => {
      makeSure.let("activity", () => new Activity("Dance"));

      makeSure.it("knows the decision names", ({assert, activity}) => {
        assert.equals(Object.keys(activity.decisions), ["setup", "roll", "outcome", "pay"]);
      });

      makeSure.it("has a setup decision, which is resolved by default, since it has no options", ({assert, activity}) => {
        let decision = activity.decisions.setup;
        assert.defined(decision);
        assert.equals(decision.options, []);
        assert.true(decision.resolved);
      });

      makeSure.it("has a roll decision, which is unresolved by default, since no ability has been rolled", ({assert, activity}) => {
        let decision = activity.decisions.roll;
        assert.defined(decision);
        assert.equals(decision.options, activity.abilities);
        assert.false(decision.resolved);
        
        decision.resolution = "Economy";
        assert.true(decision.resolved);

        assert.equals(activity.usedAbility, "Economy");
      });

      makeSure.it("has an outcome decision, which is unresolved by default, since no outcome has been picked", ({assert, activity}) => {
        let decision = activity.decisions.outcome;
        assert.defined(decision);
        assert.equals(decision.options, ["criticalSuccess", "success", "failure", "criticalFailure"]);
        assert.false(decision.resolved);
        
        decision.resolution = "criticalSuccess";
        assert.true(decision.resolved);

        assert.equals(activity.outcome, "criticalSuccess");
      });

      makeSure.it("has a pay decision, which is resolved by default, since no payment options are given", ({assert, activity}) => {
        let decision = activity.decisions.pay;
        assert.defined(decision);
        assert.equals(decision.options, []);
        assert.true(decision.resolved);
      });
    });

    makeSure.describe("resolved", makeSure => {
      makeSure.it("is not resolved by default", ({assert}) => {
        let activity = new Activity("Dance");
        assert.false(activity.resolved);
      });

      makeSure.it("is resolved if all decisions are resolved", ({assert}) => {
        let activity = new Activity({name: "Dance", usedAbility: "Economy", outcome: "success"});
        assert.equals(activity.usedAbility, "Economy");
        assert.equals(activity.decisions.roll.resolved, true);
        assert.equals(activity.outcome, "success");
        assert.equals(activity.decisions.outcome.resolved, true);
        assert.true(activity.resolved);
      });
    });
  });
});
