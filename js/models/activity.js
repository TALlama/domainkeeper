import { addTransient } from "./utils.js";
import { Ability } from "./abilities.js";
import { Structure } from "./structure.js";
import { AvalableStructures } from "../components/available_structures.js";
import { StructureDescription } from "../components/structure_description.js";

let callOrReturn = (value, bindTo, ...args) => { return value?.call ? value.call(bindTo, ...args) : value };

class ActivityDecision {
  constructor(properties, activity) {
    Object.defineProperty(this, "activity", {enumerable: false, value: activity});
    addTransient(this, {value: {}});
    Object.defineProperty(this, "options", {enumerable: true,
      get() { return callOrReturn(this.transient.options, this) || [] },
      set(value) { this.transient.options = value },
    });

    let template = {
      Roll: {
        saveAs: "ability",
        options: Ability.all,
        displayValue: (ability) => `<ability-roll ability="${ability}">${ability}</ability-roll>`,
        description: `<difficulty-class base="${JSON.stringify(10)}"></difficulty-class>`,
      },
      Outcome: {
        saveAs: "outcome",
        options: ["criticalSuccess", "success", "failure", "criticalFailure"],
        displayValues: {
          criticalSuccess: `Critical Success`,
          success: `Success`,
          failure: `Failure`,
          criticalFailure: `Critical Failure`,
        },
        picked: (outcome) => {
          activity[outcome]?.call(activity);
        }
      },
    }[properties.template || properties.name || properties] || {};
    let props = {
      saveAs: (template.name || properties.name || properties).toLowerCase(),
      saveValue: (value) => value,
      displayValue: (value) => (this.displayValues || {})[value] || value,
      summaryValue: (value) => (this.summaries || {})[value],
      mutable: () => !this.resolved,
      ...template,
      ...properties};
    Object.assign(this, props);

    this.displayValues ||= this.options.toDictionary(o => [o, this.displayValue(o)]);
    this.summaries ||= this.options.toDictionary(o => [o, this.summaryValue(o)]);

    this.#addStashProperty(activity);
    this.#addSaveAsProperty(activity, props.saveAs);
    this.#addValueProperty(activity, `${props.saveAs}Value`);
    this.#addDisplayProperty(activity, `${props.saveAs}Display`);
    this.#addSummaryProperty(activity, `${props.saveAs}Summary`);
  }

  #addStashProperty(activity) {
    if (activity._stash) { return }

    let stash = {};
    Object.defineProperty(activity, "_stash", {configurable: true, enumerable: false, get() { return stash }});
  }

  #addSaveAsProperty(activity, saveAs) {
    let decision = this;

    Object.defineProperty(activity, saveAs, {
      configurable: true,
      enumerable: true,
      get() { return activity._stash[`_${saveAs}`] },
      set(value) {
        if (![...decision.options, null, undefined].includes(value)) {
          throw TypeError(`Canot set ${saveAs} to ${value}; try one of ${JSON.stringify(decision.options)}`)
        }
        if (activity._stash[`_${saveAs}`] === value) { return }

        activity._stash[`_${saveAs}`] = value;
        activity.callbacksEnabled && decision.picked?.call(activity, value, {decision, activity});
      },
    });
  }

  #addValueProperty(activity, saveAsValue) {
    let decision = this;

    Object.defineProperty(activity, saveAsValue, {
      configurable: true,
      get() { return decision.saveValue(decision.resolution) },
      set(value) { decision.resolution = decision.options.find(option => decision.saveValue(option) === value) },
    });
  }

  #addDisplayProperty(activity, saveAsDisplay) {
    let decision = this;

    Object.defineProperty(activity, saveAsDisplay, {
      configurable: true,
      get() { return decision.displayValue(decision.resolution) },
      set(value) { decision.resolution = decision.options.find(option => decision.displayValue(option) === value) },
    });
  }

  #addSummaryProperty(activity, saveAsSummary) {
    let decision = this;

    Object.defineProperty(activity, saveAsSummary, {
      configurable: true,
      get() { return decision.summaryValue(decision.resolution) },
    });
  }

  //get options() { return callOrReturn(this.transient.options, this) || [] }
  //set options(value) { this.transient.options = value }

  get dictionary() { return this.options.toDictionary(o => [this.saveValue(o), this.displayValue(o)]) }

  get resolution() { return this.activity[this.saveAs] }
  set resolution(value) { this.activity[this.saveAs] = value }

  get mutable() { return callOrReturn(this._mutable, this.activity, this.activity, this) }
  set mutable(value) { this._mutable = value }

  get resolved() { return this.options.length === 0 || !!this.resolution }
}

export class Activity {
  constructor(properties) {
    this.log = [];
    addTransient(this, {value: {}});

    let [templateName, props] = ("string" === typeof properties) ? [properties, {}] : [properties.name, properties];
    props = {
      decisions: [{name: "Roll"}, {name: "Outcome"}],
      ...Activity.template(templateName),
      ...props};
    Object.assign(this, props);

    // evaluate the template's lazy-loaded properties
    "description".split(" ").forEach(prop =>
      this[prop] && this[prop].call && (this[prop] = this[prop]())
    );

    this.name ||= templateName;
    this.id ||= `activity-${this.name}-${crypto.randomUUID()}`;

    Object.defineProperty(this, `callbacksEnabled`, {get() {return true}});
  }

  /////////////////////////////////////////////// Associations

  // TODO how can we do this without hitting the DOM?
  get domainSheet() { return document.querySelector("domain-sheet") }
  get actor() { return this.domainSheet.actor(this.actorId) }

  /////////////////////////////////////////////// Decisions & Resolution

  get decisions() { return this.transient.decisions }
  set decisions(value) {
    this.transient.decisions = value.map(v => v.constructor === ActivityDecision ? v : new ActivityDecision(v, this));
  }
  decision(name) { return this.decisions.find(d => d.name === name) }

  get resolved() { return this.decisions.reduce((all, d) => all && d.resolved, true) }
  
  /////////////////////////////////////////////// Actions

  boost(...abilities) {
    let {by} = abilities[0];
    by && abilities.shift();
    by ??= 1;
    abilities.forEach(ability => {
      this.domainSheet.boost({by}, ability);
      this.info(`📈 Boosted ${ability} by ${by} <small>, to ${this.domainSheet.data[ability.toLowerCase()]}</small>`);
    });
  }

  reduce(...abilities) {
    let {by} = abilities[0];
    by && abilities.shift();
    by ??= -1;
    abilities.forEach(ability => {
      this.domainSheet.boost({by}, ability);
      this.warning(`📉 Reduced ${ability} by ${Math.abs(by)} <small>, to ${this.domainSheet.data[ability.toLowerCase()]}</small>`);
    });
  }

  addConsumable(attrs, logMessage) {
    this.info(logMessage || `➕ Added ${attrs.name}`);
    this.domainSheet.addConsumable(attrs);
  }

  addFame() {
    this.log("👩🏻‍🎤 Add fame");
    this.domainSheet.addFame();
  }

  addBonusActivity(actor) {
    this.log(`🛟 Added bonus activity for ${actor.name}`);
    actor.bonusActivities += 1;
  }

  /////////////////////////////////////////////// Logging

  debug(html) { this.log.push({level: "debug", html}) }
  info(html) { this.log.push({level: "info", html}) }
  warning(html) { this.log.push({level: "warning", html}) }
  error(html) { this.log.push({level: "error", html}) }
  
  /////////////////////////////////////////////// Templates

  static template(name) { return this.templates.find(s => s.name === name) }
  
  static get names() { return this._names ||= this.templates.map(s => s.name) }
  static get templates() { return this._templates ||= [{
    icon: "👑",
    actorId: "system",
    name: "Welcome, Domainkeeper",
    summary: "You've got a new domain. Let's see how it goes.",
    decisions: [],
    description: () => `
      <p>💡 Here's a little app to do the math so we can see if this system works. Is it too easy? Too hard? Do these activities make sense? Poke around and play to find out!</p>
      <p>👑 Click the buttons above to do activities. You can cancel activities until you click buttons to roll or spend, so feel free to explore.</p>
      <p>♻️ When you're out of activities each turn, click "End turn" to see a summary of what's changed and start the next turn.</p>
      <p>💾 Warning! At the end of every turn, we auto-save domain stats (the sidebar) but not the action history (the main content). So keep that tab open if you care about the details! If you want to start again, click the ❌ at the top of the domain sidebar!</p>
      <p>🎯 Your goal is to keep running and expanding the Kingdom while making sure no Ability drops to 0 and Unrest never gets to 20.</p>
    `,
  }, {
    icon: "🌱",
    actorId: "system",
    name: "Domain Concept",
    summary: "Let's pick some starting stats",
    description: () => `
      <p>Use the buttons below to pick your stats, or allocate them as you like.</p>
      <ol>
        <li>Start each ability at 2</li>
        <li>Heartland will boost one stat by 1</li>
        <li>Charter will boost two different stats by 1 each</li>
        <li>Government will boost three different stats by 1 each</li>
      </ol>
      <p>This should end with a 5/4/3/2 spread if you want to max one stat.</p>
      <p>But maybe that makes things too hard or too easy! We ca adjust this!</p>
    `,
    decisions: (() => {
      let boosts = {
        // Heartlands
        Forest: ["Culture"],
        Swamp: ["Culture"],
        Hill: ["Loyalty"],
        Plain: ["Loyalty"],
        Lake: ["Economy"],
        River: ["Economy"],
        Mountain: ["Stability"],
        Ruins: ["Stability"],
  
        // Charters
        Conquest: ["Loyalty"],
        Expansion: ["Culture"],
        Exploration: ["Stability"],
        Grant: ["Economy"],
        Open: [],
  
        // Governments
        Despotism: ["Stability", "Economy"],
        Feudalism: ["Stability", "Culture"],
        Oligarchy: ["Loyalty", "Economy"],
        Republic: ["Stability", "Loyalty"],
        Thaumacracy: ["Economy", "Culture"],
        Yeomanry: ["Loyalty", "Culture"],
      };
      let summaryValue = (option) => {
        let abilities = boosts[option] || [];
        return abilities.length === 0 ? `Free boost` : `Boost ${abilities.join(" and ")}`;
      };
      let picked = (option, {activity}) => activity.boost(...boosts[option]);

      return [{
        name: "Heartland",
        saveAs: "heartland",
        options: "Forest Swamp Hill Plain Lake River Mountain Ruins".split(" "),
        picked,
        summaryValue,
      }, {
        name: "Charter",
        saveAs: "charter",
        options: "Conquest Expansion Exploration Grant Open".split(" "),
        picked,
        summaryValue,
      }, {
        name: "Free Charter Boost",
        saveAs: "freeCharterBoost",
        options: Ability.all,
        picked: (ability, {activity}) => activity.boost(ability),
      }, {
        name: "Government",
        saveAs: "government",
        options: "Despotism Feudalism Oligarchy Republic Thaumacracy Yeomanry".split(" "),
        picked,
        summaryValue,
      }, {
        name: "Free Government Boost",
        saveAs: "freeGovernmentBoost",
        options: Ability.all,
        picked: (ability, {activity}) => activity.boost(ability),
      }];
    })(),
  }, {
    type: "leadership",
    icon: "🧭",
    name: "Reconnoiter Hex",
    summary: "You hire a team to survey a particular hex.",
    // TODO limit to after you've built an appropriate structure?
    decisions: [
      {name: "Roll", options: ["Economy", "Stability"]},
      {
        name: "Outcome",
        summaries: {
          criticalSuccess: `Reconnoiter hex and boost stability`,
          success: `Reconnoiter hex`,
          failure: `Fail`,
          criticalFailure: `Unrest`,
        },
      }
    ],
    // TODO difficultyClassOptions: {options: JSON.stringify(hexDCOptions)},
    criticalSuccess() {
      this.success();
      this.info("🗺️ The world feels a wee bit safer now.");
      this.boost("Stability")
    },
    success() { this.info("🎉 You successfully reconnoiter the hex.") },
    failure() { this.warning("❌ You fail to reconnoiter the hex.") },
    criticalFailure() {
      this.error(`💀 You catastrophically fail to reconnoiter the hex and several members of the party lose their lives.`);
      this.boost("Unrest");
    },
  }, {
    type: "leadership",
    name: "Claim Hex",
    abilities: ["A", "B"],
  }, {
    type: "civic",
    icon: "💰",
    name: "Contribute",
    summary: "This settlement is hard at work.",
    decisions: [{
      name: "Contribution",
      saveAs: "contribution",
      options: () => Ability.all,
      picked: (ability, {activity}) => activity.boost(ability),
    }],
  }, {
    type: "civic",
    icon: "🚧",
    name: "Build Structure",
    summary: "Construct something in this settlement that will have long-term benefits",
    description: () => `Add building's cost to the DC`,
    decisions: [{
      name: "Pick a structure",
      description: "Choose a structure you want to build.",
      saveAs: "structureName",
      options: () => new AvalableStructures().names,
      displayValue: structureName => `<structure-description name="${structureName}"></structure-description>`,
      mutable: (activity, decision) => activity.decision("Roll").mutable,
    },
    {
      name: "Roll",
      options: ["Economy"]
    },
    {
      name: "Outcome",
      summaries: {
        criticalSuccess: `Build it; Boost a random Ability by 1`,
        success: `Build it`,
        failure: `Fail`,
        criticalFailure: `Fail; Reduce a random Ability by 1`,
      },
    },
    {
      name: "Pay with",
      saveAs: "paymentAbility",
      options: () => Ability.all,
    }],
    criticalSuccess() {
      this.info("😂 Everyone rallies to help.");
      this.boost(Ability.random);
      this.success();
    },
    success() {
      this.info(`🏛️ You built the ${this.structureName}!`);
      this.actor.powerups.push(new Structure(this.structureName));

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
  }]}
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

  makeSure.describe("decisions", makeSure => {
    let makeActivity = (decision) => new Activity({name: "Dance", decisions: [decision]});

    makeSure.it("configures the decision with the object I pass in", ({assert}) => {
      let activity = makeActivity({name: "Color", options: ["Red", "Green", "Blue"]});
      assert.equals(activity.decisions.length, 1);
      assert.equals(activity.decision("Color").options, ["Red", "Green", "Blue"]);
    });

    makeSure.it("accepts a property that's a function", ({assert}) => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      assert.equals(activity.decision("Color").options, ["Red", "Green", "Blue"]);
    });

    makeSure.it("exposes an accessor for the parameter", ({assert}) => {
      let callbacks = [];
      let activity = makeActivity({
        name: "Color",
        options: () => ["Red", "Green", "Blue"],
        picked: (color, {decision, activity}) => callbacks.push(color),
      });
      activity.color = null;
      activity.color = "Blue";
      assert.equals(callbacks, [null, "Blue"]);
      assert.equals(activity.color, "Blue");
    });

    makeSure.it("causes an exception if you try to set something that's not an option", ({assert}) => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      assert.expectError(() => activity.color = "Yellow", "TypeError");
    });

    makeSure.describe("savedValue allows you to work with objects but save IDs", makeSure => {
      let saveValue = (color) => color ? color[0].toLowerCase() : null;

      makeSure.it("by default, uses the value itself", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        assert.equals(activity.decision("Color").saveValue("Red"), "Red");
      });

      makeSure.it("can be set via property", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], saveValue});
        assert.equals(activity.decision("Color").saveValue("Red"), "r");
        assert.jsonEquals(activity.decision("Color").dictionary, {r: "Red", g: "Green", b: "Blue"});
      });

      makeSure.it("exposes an accessor for the current save value", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], saveValue});
        
        assert.equals(activity.colorValue, null);
        
        activity.color = "Red";
        assert.equals(activity.colorValue, "r");

        activity.colorValue = "g";
        assert.equals(activity.color, "Green");
        assert.equals(activity.colorValue, "g");
      });
    });

    makeSure.describe("displayValue allows you to work with objects but show components or names", makeSure => {
      let displayValue = (color) => color ? color[0].toUpperCase() : null;

      makeSure.it("by default, uses the value itself", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        assert.equals(activity.decision("Color").displayValue("Red"), "Red");
      });

      makeSure.it("can be set via property, using a function", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue});
        assert.equals(activity.decision("Color").displayValue("Red"), "R");
        assert.jsonEquals(activity.decision("Color").dictionary, {Red: "R", Green: "G", Blue: "B"});
      });

      makeSure.it("can be set via property, using a dictionary", ({assert}) => {
        let displayValues = {Red: "R", Green: "G", Blue: "B"};
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValues});
        assert.equals(activity.decision("Color").displayValue("Red"), "R");
        assert.jsonEquals(activity.decision("Color").dictionary, displayValues);
      });

      makeSure.it("exposes an accessor for the current display value", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue});
        
        assert.equals(activity.colorDisplay, null);
        
        activity.color = "Red";
        assert.equals(activity.colorDisplay, "R");

        activity.colorDisplay = "G";
        assert.equals(activity.color, "Green");
        assert.equals(activity.colorDisplay, "G");
      });
    });

    makeSure.describe("summaryValue allow you to work with objects but show short descriptions", makeSure => {
      let summaries = {Red: "Like a fire truck", Green: "Like a plant", Blue: "Like the sky"};
      let summaryValue = (color) => summaries[color];

      makeSure.it("by default, no summary is given", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        assert.equals(activity.decision("Color").summaryValue("Red"), undefined);
      });

      makeSure.it("can be set via property, using a function", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], summaryValue});
        assert.equals(activity.decision("Color").summaryValue("Red"), "Like a fire truck");
        assert.jsonEquals(activity.decision("Color").summaries, summaries);
      });

      makeSure.it("can be set via property, using a dictionary", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], summaries});
        assert.equals(activity.decision("Color").summaryValue("Red"), "Like a fire truck");
        assert.jsonEquals(activity.decision("Color").summaries, summaries);
      });

      makeSure.it("exposes a (read only) accessor for the current display value", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], summaryValue});
        
        assert.equals(activity.colorSummary, undefined);
        
        activity.color = "Red";
        assert.equals(activity.colorSummary, "Like a fire truck");
      });
    });

    makeSure.describe("mutability allows the user to edit their pick", makeSure => {
      makeSure.it("by default, is only mutable while pending", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        let decision = activity.decision("Color");
        
        assert.true(decision.mutable);
        
        activity.color = "Red";
        assert.false(decision.mutable);
      });

      makeSure.it("can be overridden with properties", ({assert}) => {
        let whatever = true;
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], mutable: () => whatever});
        let decision = activity.decision("Color");
        
        assert.true(decision.mutable);
        
        whatever = false;
        assert.false(decision.mutable);
      });
    });
  });

  makeSure.describe("default decisions", makeSure => {
    makeSure.it("has two decisions: roll and outcome", ({assert}) => {
      let activity = new Activity("Dance");
      assert.equals(activity.decisions.map(d => d.name), ["Roll", "Outcome"]);
    });

    makeSure.describe("Roll decision", makeSure => {
      makeSure.describe("saveAs", makeSure => {
        makeSure.it("gets defaults if not set", ({assert}) => {
          let activity = new Activity({name: "Dance", ability: "Culture"});
          let decision = activity.decision("Roll");
          assert.equals(decision.saveAs, "ability");
          assert.equals(decision.resolution, "Culture");
        });

        makeSure.it("can be set by the properties", ({assert}) => {
          let activity = new Activity({name: "Dance", rolled: "Culture", decisions: [{name: "Roll", saveAs: "rolled"}]});
          let decision = activity.decision("Roll");
          assert.equals(decision.saveAs, "rolled");
          assert.equals(decision.resolution, "Culture");
        });
      });
      
      makeSure.describe("options", makeSure => {
        makeSure.it("gets defaults if not set", ({assert}) => {
          let activity = new Activity("Dance");
          let decision = activity.decision("Roll");
          assert.equals(decision.options, Ability.all);
          assert.equals(decision.displayValue("Culture"), `<ability-roll ability="Culture">Culture</ability-roll>`);
        });

        makeSure.it("can be set by the properties", ({assert}) => {
          let activity = new Activity({name: "Dance", decisions: [{name: "Roll", options: ["Culture"]}]});
          let decision = activity.decision("Roll");
          assert.equals(decision.options, ["Culture"]);
          assert.equals(decision.displayValue("Culture"), `<ability-roll ability="Culture">Culture</ability-roll>`);
        });
      });
    });

    makeSure.describe("Outcome decision", makeSure => {
      makeSure.describe("saveAs", makeSure => {
        makeSure.it("gets defaults if not set", ({assert}) => {
          let activity = new Activity({name: "Dance", outcome: "success"});
          let decision = activity.decision("Outcome");
          assert.equals(decision.saveAs, "outcome");
          assert.equals(decision.resolution, "success");
        });

        makeSure.it("can be set by the properties", ({assert}) => {
          let activity = new Activity({name: "Dance", successLevel: "success", decisions: [{name: "Outcome", saveAs: "successLevel"}]});
          let decision = activity.decision("Outcome");
          assert.equals(decision.saveAs, "successLevel");
          assert.equals(decision.resolution, "success");
        });
      });
      
      makeSure.describe("options", makeSure => {
        makeSure.it("gets defaults if not set", ({assert}) => {
          let activity = new Activity("Dance");
          let decision = activity.decision("Outcome");
          assert.equals(decision.options, "criticalSuccess success failure criticalFailure".split(" "));
          assert.equals(decision.displayValue("criticalSuccess"), `Critical Success`);
        });

        makeSure.it("can be set by the properties", ({assert}) => {
          let activity = new Activity({name: "Dance", decisions: [{name: "Outcome", options: ["criticalSuccess"]}]});
          let decision = activity.decision("Outcome");
          assert.equals(decision.options, ["criticalSuccess"]);
          assert.equals(decision.displayValue("criticalSuccess"), `Critical Success`);
        });
      });

      makeSure.it("setting the outcome calls outcome callbacks", ({assert}) => {
        let callbacks = {criticalSuccess: 0, success: 0, failure: 0, criticalFailure: 0};
        let activity = new Activity({
          criticalSuccess: () => callbacks.criticalSuccess++,
          success: () => callbacks.success++,
          failure: () => callbacks.failure++,
          criticalFailure: () => callbacks.criticalFailure++,
        });

        activity.outcome = "criticalSuccess";
        assert.equals(callbacks.criticalSuccess, 1);

        activity.outcome = "success";
        assert.equals(callbacks.success, 1);

        activity.outcome = "failure";
        assert.equals(callbacks.failure, 1);

        activity.outcome = "criticalFailure";
        assert.equals(callbacks.criticalFailure, 1);

        activity.outcome = null;
      });

      makeSure.it("does not hit callbacks when restoring state or setting the same value", ({assert}) => {
        let callbacks = {criticalSuccess: 0, success: 0, failure: 0, criticalFailure: 0};
        let activity = new Activity({
          criticalSuccess: () => callbacks.criticalSuccess++,
          outcome: "criticalSuccess",
        });

        assert.equals(callbacks.criticalSuccess, 0);
        activity.outcome = "criticalSuccess";
        assert.equals(callbacks.criticalSuccess, 0);
      });
    });
  });

  makeSure.describe("resolved", makeSure => {
    makeSure.it("is not resolved by default", ({assert}) => {
      let activity = new Activity("Dance");
      assert.false(activity.resolved);
    });

    makeSure.it("is resolved if all decisions are resolved", ({assert}) => {
      let activity = new Activity({name: "Dance", ability: "Economy", outcome: "success"});
      assert.equals(activity.ability, "Economy");
      assert.equals(activity.decision("Roll").resolved, true);
      assert.equals(activity.outcome, "success");
      assert.equals(activity.decision("Outcome").resolved, true);
      assert.true(activity.resolved);
    });
  });
});