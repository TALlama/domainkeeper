import { Eris } from "../eris.js";

import { addTransient } from "./utils.js";
import { withTemplates } from "./with_templates.js";
import { makeId } from "./with_id.js";
import { Ability } from "./abilities.js";
import { ActivityDecision } from "./activity_decision.js";

import { civicTemplates } from "./ability_templates/civic.js";
import { leadershipTemplates } from "./ability_templates/leadership.js";
import { systemTemplates } from "./ability_templates/system.js";

export class Activity {
  constructor(properties) {
    this.log = [];
    addTransient(this, {value: {}});
    this.transient.currentTurn = properties.currentTurn;
    delete properties.currentTurn;

    this.init(properties, {decisions: [{name: "Roll"}, {name: "Outcome"}]});

    // evaluate the template's lazy-loaded properties
    "description".split(" ").forEach(prop =>
      this[prop] && this[prop].call && (this[prop] = this[prop]())
    );

    this.id ||= makeId(`activity`, this.name);

    Object.defineProperty(this, `callbacksEnabled`, {get() {return true}});
  }

  /////////////////////////////////////////////// Associations

  // TODO how can we do this without hitting the DOM?
  get domainSheet() { return document.querySelector("domain-sheet") }
  get actor() { return this.domainSheet.actor(this.actorId) }
  get currentTurn() { return this.transient.currentTurn ?? this.domainSheet.currentTurn }
  
  peerActivities() {
    return "civic system".split(" ").includes(this.type)
      ? []
      : (this.currentTurn.activities || []).filter(e => e.name === this.name) || [];
  }

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
    if (by < 0) { return this.reduce({by}, ...abilities) }
    abilities.forEach(ability => {
      this.domainSheet.boost({by}, ability);
      this.info(`📈 Boosted ${ability} by ${by} <small>, to ${this.domainSheet.data[ability.toLowerCase()]}</small>`);
    });
  }

  reduce(...abilities) {
    let {by} = abilities[0];
    by && abilities.shift();
    by ??= -1;

    if (by > 0) { return this.boost({by}, ...abilities) }
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
    this.info("👩🏻‍🎤 Add fame");
    this.domainSheet.addFame();
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

Eris.test("Activity", makeSure => {
  makeSure.it("remembers the properties given to it", ({assert}) => {
    let activity = new Activity({name: "Dance", prop: "value"});
    assert.equals(activity.name, "Dance");
    assert.equals(activity.prop, "value");
  });
  makeSure.it("pulls properties from the template", ({assert}) => {
    let activity = new Activity("Claim Hex");
    assert.equals(activity.name, "Claim Hex");
    assert.equals(activity.decision("Roll").options, ["Economy", "Stability"]);
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

  makeSure.describe("peerActivities()", makeSure => {
    makeSure.it("returns no items if the turn is empty", ({assert}) => {
      let activity = new Activity({name: "Dance", currentTurn: {}});
      assert.equals(activity.peerActivities(), []);
    });
    makeSure.it("for leadership activities, returns the items from the turn's entries (leaders focus then move on)", ({assert}) => {
      let currentTurn = {activities: [
        {name: "Dance", id: "a"},
        {name: "Dance", id: "b"},
        {name: "Revolution", id: "c"},
      ]};
      let activity = new Activity({name: "Dance", type: "leadership", currentTurn});
      assert.equals(activity.peerActivities().map(a => a.id), ["a", "b"]);
    });
    makeSure.it("for civic activities, returns no items ever (cities can distribute focus)", ({assert}) => {
      let currentTurn = {activities: [
        {name: "Dance", id: "a"},
        {name: "Dance", id: "b"},
        {name: "Revolution", id: "c"},
      ]};
      let activity = new Activity({name: "Dance", type: "civic", currentTurn});
      assert.equals(activity.peerActivities(), []);
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

    makeSure.describe("optionDisableReason allows you to mark options as disabled, and explain why", makeSure => {
      let options = ["Red", "Green", "Blue"];
      let optionDisableReason = (color) => color == "Red" ? "Too red" : null;

      makeSure.it("by default, nothing is disabled", ({assert}) => {
        let activity = makeActivity({name: "Color", options});
        assert.equals(activity.decision("Color").optionDisableReason(options.random()), null);
        assert.equals(activity.decision("Color").enabledOptions, options);
        assert.equals(activity.decision("Color").disabledOptions, []);
      });

      makeSure.it("can disable any given option", ({assert}) => {
        let activity = makeActivity({name: "Color", options, optionDisableReason});
        assert.equals(activity.decision("Color").optionDisableReason("Red"), "Too red");
        assert.equals(activity.decision("Color").optionDisableReason("Blue"), null);
        assert.equals(activity.decision("Color").enabledOptions, ["Green", "Blue"]);
        assert.equals(activity.decision("Color").disabledOptions, ["Red"]);
      });
    });

    makeSure.describe("savedValue allows you to work with objects but save IDs", makeSure => {
      let saveValue = (color) => color ? color[0].toLowerCase() : null;

      makeSure.it("by default, uses the value itself", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        assert.equals(activity.decision("Color").saveValue("Red"), "Red");
        assert.equals(activity.decision("Color").unsaveValue("Red"), "Red");
      });

      makeSure.it("can be set via property", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], saveValue});
        assert.equals(activity.decision("Color").saveValue("Red"), "r");
        assert.equals(activity.decision("Color").unsaveValue("r"), "Red");
        assert.jsonEquals(activity.decision("Color").dictionary, {r: "Red", g: "Green", b: "Blue"});
      });

      makeSure.it("exposes an accessor for the current save value", ({assert}) => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], saveValue});
        let decision = activity.decision("Color");
        
        assert.equals(activity.colorValue, undefined);
        assert.equals(decision.resolution, undefined);
        assert.equals(decision.resolutionValue, undefined);
        
        //setting via the saveAs property
        activity.color = "r";
        assert.equals(activity.color, "r");
        assert.equals(decision.resolution, "r");
        assert.equals(activity.colorValue, "Red");
        assert.equals(decision.resolutionValue, "Red");

        //setting via the saveAsValue property
        activity.colorValue = "Green";
        assert.equals(activity.color, "g");
        assert.equals(decision.resolution, "g");
        assert.equals(activity.colorValue, "Green");
        assert.equals(decision.resolutionValue, "Green");
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
      makeSure.describe("displayResolvedValue allows you to show different things when the decision is resolved", makeSure => {
        let displayResolvedValue = (color) => color ? color.toUpperCase() : null;

        makeSure.it("by default, uses the value itself", ({assert}) => {
          let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
          assert.equals(activity.decision("Color").displayResolvedValue("Red"), "Red");
        });

        makeSure.it("if there is a displayValue, uses that", ({assert}) => {
          let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue});
          assert.equals(activity.decision("Color").displayResolvedValue("Red"), "R");
        });

        makeSure.it("can be set via property, using a function", ({assert}) => {
          let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue, displayResolvedValue});
          assert.equals(activity.decision("Color").displayResolvedValue("Red"), "RED");
        });

        makeSure.it("exposes an accessor for the current display value", ({assert}) => {
          let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue, displayResolvedValue});

          assert.equals(activity.colorDisplayResolved, null);

          activity.color = "Red";
          assert.equals(activity.colorDisplayResolved, "RED");

          activity.colorDisplay = "G";
          assert.equals(activity.color, "Green");
          assert.equals(activity.colorDisplayResolved, "GREEN");
        });
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
