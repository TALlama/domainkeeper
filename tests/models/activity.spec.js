const { test, expect } = require('@playwright/test');
const { Ability } = require("../../js/models/abilities");
const { Activity } = require("../../js/models/activity");

test("remembers the properties given to it", () => {
  let activity = new Activity({name: "Dance", prop: "value"});
  expect(activity.name).toEqual("Dance");
  expect(activity.prop).toEqual("value");
});

test("pulls properties from the template", () => {
  let activity = new Activity("Claim Hex");
  expect(activity.name).toEqual("Claim Hex");
  expect(activity.decision("Roll").options).toEqual(["Economy", "Stability"]);
});

test.describe("id", () => {
  test("gets a default if not set", () => {
    let activity = new Activity("Dance");
    expect(activity.id).toBeDefined();
  });

  test("accepts a property", () => {
    let activity = new Activity({name: "Dance", id: "etcetc"});
    expect(activity.id).toEqual("etcetc");
  });
});

test.describe("description", () => {
  test("defaults to null", () => {
    let activity = new Activity("Dance");
    expect(activity.description).toEqual(undefined);
  });
  test("accepts a function parameter", () => {
    let activity = new Activity({name: "Dance", description: () => "etcetc"});
    expect(activity.description).toEqual("etcetc");
  });
});

test.describe("peerActivities()", () => {
  test("returns no items if the turn is empty", () => {
    let activity = new Activity({name: "Dance"}, {});
    expect(activity.peerActivities()).toEqual([]);
  });

  test("for leadership activities, returns the items from the turn's entries (leaders focus then move on)", () => {
    let turn = {activities: [
      {name: "Dance", id: "a"},
      {name: "Dance", id: "b"},
      {name: "Revolution", id: "c"},
    ]};
    let activity = new Activity({name: "Dance", type: "leadership"}, turn);
    expect(activity.peerActivities().map(a => a.id)).toEqual(["a", "b"]);
  });

  test("for civic activities, returns no items ever (cities can distribute focus)", () => {
    let turn = {activities: [
      {name: "Dance", id: "a"},
      {name: "Dance", id: "b"},
      {name: "Revolution", id: "c"},
    ]};
    let activity = new Activity({name: "Dance", type: "civic"}, turn);
    expect(activity.peerActivities()).toEqual([]);
  });
});

test.describe("log", () => {
  test("has no log entries by default, but can add them", () => {
    const activity = new Activity("Dance");
    expect(activity.log.length).toEqual(0);
  });

  test("can log debug text to help programmers find bugs", () => {
    const activity = new Activity("Dance");
    activity.debug("Internal state: THX-1138");
    expect(activity.log).toEqual([{level: "debug", html: "Internal state: THX-1138"}]);
  });

  test("can log informative text to track what happened", () => {
    const activity = new Activity("Dance");
    activity.info("Something happened that we want to remember");
    expect(activity.log).toEqual([{level: "info", html: "Something happened that we want to remember"}]);
  });

  test("can log warning text to highlight bad stuf", () => {
    const activity = new Activity("Dance");
    activity.warning("Pirates attacked");
    expect(activity.log).toEqual([{level: "warning", html: "Pirates attacked"}]);
  });

  test("can log error text to explain why something didn't work", () => {
    const activity = new Activity("Dance");
    activity.error("You're all out of spoons");
    expect(activity.log).toEqual([{level: "error", html: "You're all out of spoons"}]);
  });
});

test.describe("decisions", () => {
  let makeActivity = (decision) => new Activity({name: "Dance", decisions: [decision]});

  test("configures the decision with the object I pass in", () => {
    let activity = makeActivity({name: "Color", options: ["Red", "Green", "Blue"]});
    expect(activity.decisions.length).toEqual(1);
    expect(activity.decision("Color").options).toEqual(["Red", "Green", "Blue"]);
  });

  test("accepts a property that's a function", () => {
    let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
    expect(activity.decision("Color").options).toEqual(["Red", "Green", "Blue"]);
  });

  test("exposes an accessor for the parameter", () => {
    let callbacks = [];
    let activity = makeActivity({
      name: "Color",
      options: () => ["Red", "Green", "Blue"],
      picked: (color, {decision, activity}) => callbacks.push(color),
    });
    activity.color = null;
    activity.color = "Blue";
    expect(callbacks).toEqual([null, "Blue"]);
    expect(activity.color).toEqual("Blue");
  });

  test("causes an exception if you try to set something that's not an option", () => {
    let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
    expect(() => activity.color = "Yellow").toThrow('Cannot set color to Yellow; try one of ["Red","Green","Blue"]');
  });

  test.describe("optionDisableReason allows you to mark options as disabled, and explain why", () => {
    let options = ["Red", "Green", "Blue"];
    let optionDisableReason = (color) => color == "Red" ? "Too red" : null;

    test("by default, nothing is disabled", () => {
      let activity = makeActivity({name: "Color", options});
      expect(activity.decision("Color").optionDisableReason(options.random())).toEqual(null);
      expect(activity.decision("Color").enabledOptions).toEqual(options);
      expect(activity.decision("Color").disabledOptions).toEqual([]);
    });

    test("can disable any given option", () => {
      let activity = makeActivity({name: "Color", options, optionDisableReason});
      expect(activity.decision("Color").optionDisableReason("Red")).toEqual("Too red");
      expect(activity.decision("Color").optionDisableReason("Blue")).toEqual(null);
      expect(activity.decision("Color").enabledOptions).toEqual(["Green", "Blue"]);
      expect(activity.decision("Color").disabledOptions).toEqual(["Red"]);
    });
  });

  test.describe("savedValue allows you to work with objects but save IDs", () => {
    let saveValue = (color) => color ? color[0].toLowerCase() : null;

    test("by default, uses the value itself", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      expect(activity.decision("Color").saveValue("Red")).toEqual("Red");
      expect(activity.decision("Color").unsaveValue("Red")).toEqual("Red");
    });

    test("can be set via property", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], saveValue});
      expect(activity.decision("Color").saveValue("Red")).toEqual("r");
      expect(activity.decision("Color").unsaveValue("r")).toEqual("Red");
      expect(activity.decision("Color").dictionary).toEqual({r: "Red", g: "Green", b: "Blue"});
    });

    test("exposes an accessor for the current save value", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], saveValue});
      let decision = activity.decision("Color");
      
      expect(activity.colorValue).toBe(undefined);
      expect(decision.resolution).toBe(undefined);
      expect(decision.resolutionValue).toBe(undefined);
      
      //setting via the saveAs property
      activity.color = "r";
      expect(activity.color).toEqual("r");
      expect(decision.resolution).toEqual("r");
      expect(activity.colorValue).toEqual("Red");
      expect(decision.resolutionValue).toEqual("Red");

      //setting via the saveAsValue property
      activity.colorValue = "Green";
      expect(activity.color).toEqual("g");
      expect(decision.resolution).toEqual("g");
      expect(activity.colorValue).toEqual("Green");
      expect(decision.resolutionValue).toEqual("Green");
    });
  });

  test.describe("displayValue allows you to work with objects but show components or names", () => {
    let displayValue = (color) => color ? color[0].toUpperCase() : null;

    test("by default, uses the value itself", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      expect(activity.decision("Color").displayValue("Red")).toEqual("Red");
    });

    test("can be set via property, using a function", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue});
      expect(activity.decision("Color").displayValue("Red")).toEqual("R");
      expect(activity.decision("Color").dictionary).toEqual({Red: "R", Green: "G", Blue: "B"});
    });

    test("can be set via property, using a dictionary", () => {
      let displayValues = {Red: "R", Green: "G", Blue: "B"};
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValues});
      expect(activity.decision("Color").displayValue("Red")).toEqual("R");
      expect(activity.decision("Color").dictionary).toEqual(displayValues);
    });

    test("exposes an accessor for the current display value", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue});
      
      expect(activity.colorDisplay).toEqual(null);
      
      activity.color = "Red";
      expect(activity.colorDisplay).toEqual("R");

      activity.colorDisplay = "G";
      expect(activity.color).toEqual("Green");
      expect(activity.colorDisplay).toEqual("G");
    });
    test.describe("displayTitleValue allows you to highlight an accessible title for each option", () => {
      let displayTitleValue = (color) => color ? color.toUpperCase() : null;

      test("by default, uses the value itself", () => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        expect(activity.decision("Color").displayTitleValue("Red")).toEqual("Red");
      });

      test("if there is a displayValue, uses that", () => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue});
        expect(activity.decision("Color").displayTitleValue("Red")).toEqual("R");
      });

      test("can be set via property, using a function", () => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue, displayTitleValue});
        expect(activity.decision("Color").displayTitleValue("Red")).toEqual("RED");
      });

      test("exposes an accessor for the current display value", () => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue, displayTitleValue});

        expect(activity.colorDisplayTitle).toEqual(null);

        activity.color = "Red";
        expect(activity.colorDisplayTitle).toEqual("RED");

        activity.colorDisplay = "G";
        expect(activity.color).toEqual("Green");
        expect(activity.colorDisplayTitle).toEqual("GREEN");
      });
    });
    test.describe("displayResolvedValue allows you to show different things when the decision is resolved", () => {
      let displayResolvedValue = (color) => color ? color.toUpperCase() : null;

      test("by default, uses the value itself", () => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
        expect(activity.decision("Color").displayResolvedValue("Red")).toEqual("Red");
      });

      test("if there is a displayValue, uses that", () => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue});
        expect(activity.decision("Color").displayResolvedValue("Red")).toEqual("R");
      });

      test("can be set via property, using a function", () => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue, displayResolvedValue});
        expect(activity.decision("Color").displayResolvedValue("Red")).toEqual("RED");
      });

      test("exposes an accessor for the current display value", () => {
        let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], displayValue, displayResolvedValue});

        expect(activity.colorDisplayResolved).toEqual(null);

        activity.color = "Red";
        expect(activity.colorDisplayResolved).toEqual("RED");

        activity.colorDisplay = "G";
        expect(activity.color).toEqual("Green");
        expect(activity.colorDisplayResolved).toEqual("GREEN");
      });
    });
  });

  test.describe("summaryValue allow you to work with objects but show short descriptions", () => {
    let summaries = {Red: "Like a fire truck", Green: "Like a plant", Blue: "Like the sky"};
    let summaryValue = (color) => summaries[color];

    test("by default, no summary is given", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      expect(activity.decision("Color").summaryValue("Red")).toEqual(undefined);
    });

    test("can be set via property, using a function", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], summaryValue});
      expect(activity.decision("Color").summaryValue("Red")).toEqual("Like a fire truck");
    });

    test("can be set via property, using a dictionary", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], summaries});
      expect(activity.decision("Color").summaryValue("Red")).toEqual("Like a fire truck");
      expect(activity.decision("Color").summaries).toEqual(summaries);
    });

    test("exposes a (read only) accessor for the current display value", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], summaryValue});
      
      expect(activity.colorSummary).toEqual(undefined);
      
      activity.color = "Red";
      expect(activity.colorSummary).toEqual("Like a fire truck");
    });
  });

  test.describe("mutability allows the user to edit their pick", () => {
    test("by default, is only mutable while pending", () => {
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      let decision = activity.decision("Color");
      
      expect(decision.mutable).toBe(true);
      
      activity.color = "Red";
      expect(decision.mutable).toBe(false);
    });

    test("can be overridden with properties", () => {
      let whatever = true;
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"], mutable: () => whatever});
      let decision = activity.decision("Color");
      
      expect(decision.mutable).toBe(true);
      
      whatever = false;
      expect(decision.mutable).toBe(false);
    });
  });

  test.describe("tells the activity whenever any decision is resolved", () => {
    test("by setting the activity's", () => {
      let resolved = [];
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      activity.decisionResolved = (decision) => resolved.push(decision.name);
      expect(resolved).toEqual([]);
      activity.color = "Red";
      expect(resolved).toEqual(["Color"]);
    });

    test("by setting the decision's resolution", () => {
      let resolved = [];
      let activity = makeActivity({name: "Color", options: () => ["Red", "Green", "Blue"]});
      activity.decisionResolved = (decision) => resolved.push(decision.name);
      expect(resolved).toEqual([]);
      activity.decision("Color").resolution = "Red";
      expect(resolved).toEqual(["Color"]);
    });
  });
});

test.describe("default decisions", () => {
  test("has two decisions: roll and outcome", () => {
    let activity = new Activity("Dance");
    expect(activity.decisions.map(d => d.name)).toEqual(["Roll", "Outcome"]);
  });

  test.describe("Roll decision", () => {
    test.describe("saveAs", () => {
      test("gets defaults if not set", () => {
        let activity = new Activity({name: "Dance", ability: "Culture"});
        let decision = activity.decision("Roll");
        expect(decision.saveAs).toEqual("ability");
        expect(decision.resolution).toEqual("Culture");
      });

      test("can be set by the properties", () => {
        let activity = new Activity({name: "Dance", rolled: "Culture", decisions: [{name: "Roll", saveAs: "rolled"}]});
        let decision = activity.decision("Roll");
        expect(decision.saveAs).toEqual("rolled");
        expect(decision.resolution).toEqual("Culture");
      });
    });
    
    test.describe("options", () => {
      test("gets defaults if not set", () => {
        let activity = new Activity("Dance");
        let decision = activity.decision("Roll");
        expect(decision.options).toEqual(Ability.all);
        expect(decision.displayValue("Culture")).toEqual(`<ability-roll ability="Culture">Culture</ability-roll>`);
      });

      test("can be set by the properties", () => {
        let activity = new Activity({name: "Dance", decisions: [{name: "Roll", options: ["Culture"]}]});
        let decision = activity.decision("Roll");
        expect(decision.options).toEqual(["Culture"]);
        expect(decision.displayValue("Culture")).toEqual(`<ability-roll ability="Culture">Culture</ability-roll>`);
      });
    });
  });

  test.describe("Outcome decision", () => {
    test.describe("saveAs", () => {
      test("gets defaults if not set", () => {
        let activity = new Activity({name: "Dance", outcome: "success"});
        let decision = activity.decision("Outcome");
        expect(decision.saveAs).toEqual("outcome");
        expect(decision.resolution).toEqual("success");
      });

      test("can be set by the properties", () => {
        let activity = new Activity({name: "Dance", successLevel: "success", decisions: [{name: "Outcome", saveAs: "successLevel"}]});
        let decision = activity.decision("Outcome");
        expect(decision.saveAs).toEqual("successLevel");
        expect(decision.resolution).toEqual("success");
      });
    });
    
    test.describe("options", () => {
      test("gets defaults if not set", () => {
        let activity = new Activity("Dance");
        let decision = activity.decision("Outcome");
        expect(decision.options).toEqual("criticalSuccess success failure criticalFailure".split(" "));
        expect(decision.displayValue("criticalSuccess")).toEqual(`Critical Success`);
      });

      test("can be set by the properties", () => {
        let activity = new Activity({name: "Dance", decisions: [{name: "Outcome", options: ["criticalSuccess"]}]});
        let decision = activity.decision("Outcome");
        expect(decision.options).toEqual(["criticalSuccess"]);
        expect(decision.displayValue("criticalSuccess")).toEqual(`Critical Success`);
      });
    });

    test("setting the outcome calls outcome callbacks", () => {
      let callbacks = {criticalSuccess: 0, success: 0, failure: 0, criticalFailure: 0};
      let activity = new Activity({
        criticalSuccess: () => callbacks.criticalSuccess++,
        success: () => callbacks.success++,
        failure: () => callbacks.failure++,
        criticalFailure: () => callbacks.criticalFailure++,
      });

      activity.outcome = "criticalSuccess";
      expect(callbacks.criticalSuccess).toEqual(1);

      activity.outcome = "success";
      expect(callbacks.success).toEqual(1);

      activity.outcome = "failure";
      expect(callbacks.failure).toEqual(1);

      activity.outcome = "criticalFailure";
      expect(callbacks.criticalFailure).toEqual(1);

      activity.outcome = null;
    });

    test("does not hit callbacks when restoring state or setting the same value", () => {
      let callbacks = {criticalSuccess: 0, success: 0, failure: 0, criticalFailure: 0};
      let activity = new Activity({
        criticalSuccess: () => callbacks.criticalSuccess++,
        outcome: "criticalSuccess",
      });

      expect(callbacks.criticalSuccess).toEqual(0);
      activity.outcome = "criticalSuccess";
      expect(callbacks.criticalSuccess).toEqual(0);
    });
  });
});

test.describe("resolved", () => {
  test("is not resolved by default", () => {
    let activity = new Activity("Dance");
    expect(activity.resolved).toBe(false);
  });

  test("is resolved if all decisions are resolved", () => {
    let activity = new Activity({name: "Dance", ability: "Economy", outcome: "success"});
    expect(activity.ability).toEqual("Economy");
    expect(activity.decision("Roll").resolved).toEqual(true);
    expect(activity.outcome).toEqual("success");
    expect(activity.decision("Outcome").resolved).toEqual(true);
    expect(activity.resolved).toBe(true);
  });
});
