const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { monitor } = require('../helpers');
const { Structure } = require('../../js/models/structure');

function makeSettlement({size, structures}) {
  return {name: "Bigappel", id: "nyc", traits: [size || "Village"], powerups: (structures || []).map(s => {return {name: s}})};
}

test.describe("Progresses toward the selected structure", () => {
  test.describe("A cost-one structure", () => {
    let costOneStructure = "Cemetery";
    let progressOutcomes = ["Critical Success", "Success"];
    let noProgressOutcomes = ["Failure", "Critical Failure"];

    test(`Can be built immediately with any of the following outcomes: ${progressOutcomes.join("; ")}`, async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({structures: ["Shrine"]})]});
      await dk.setCurrentActor("Bigappel");
  
      await expect(dk.currentActorPowerups()).toHaveText(["Shrine"]);
      await dk.pickActivity("Build Structure", costOneStructure, "Reduce Culture by 1 to proceed", "Economy", progressOutcomes.random());
      await dk.setCurrentActor("Bigappel");
      await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costOneStructure]);
    });
    
    test(`On any of the following outcomes: ${noProgressOutcomes.join("; ")}`, async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({structures: ["Shrine"]})]});
      await dk.setCurrentActor("Bigappel");

      await expect(dk.currentActorPowerups()).toHaveText(["Shrine"]);
      await dk.pickActivity("Build Structure", costOneStructure, "Reduce Culture by 1 to proceed", "Economy", noProgressOutcomes.random()),
      await dk.setCurrentActor("Bigappel");
      await expect(dk.currentActorPowerups()).toHaveText(["Shrine"]);
    });
  });

  test.describe("A higher-cost structure", () => {
    let costOneStructure = "Cemetery";
    let costTwoStructure = "Library";
    let costTwoBuildingSite = `Incomplete Library (1/2)`;

    test.describe("On a clean start", () => {
      let setup = async (page, size) => {
        let settlement = makeSettlement({size, structures: ["Shrine"]});
        const dk = await DomainkeeperPage.load(page, {...inTurnOne(), level: 2, settlements: [settlement]});
        await dk.setCurrentActor("Bigappel");
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine"]);
        return dk;
      };
      let go = async (dk, outcome, {structure, cost} = {}) => {
        await dk.pickActivity("Build Structure", structure || costTwoStructure, cost || "Reduce Culture by 1 to proceed", "Economy", outcome);
        await dk.setCurrentActor("Bigappel");
      };

      test(`Critical Success: Progresses 150% of the amount spent (round up)`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Critical Success");
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costTwoStructure]);
      });

      test(`Success: Progresses 100% of the amount spent, which can complete a structure`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Success", {structure: costOneStructure});
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costOneStructure]);
      });

      test(`Success: Progresses 100% of the amount spent, which can end with an incomplete structure`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Success");
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costTwoBuildingSite]);
      });

      test(`Failure: Progresses 50% of the amount spent, which can complete the structure`, async ({ page }) => {
        const dk = await setup(page, "Town");
        await go(dk, "Failure", {structure: costOneStructure, cost: "Reduce Culture by 2 to proceed"});
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costOneStructure]);
      });

      test(`Failure: Progresses 50% of the amount spent, which can be a bit of progress`, async ({ page }) => {
        const dk = await setup(page, "Town");
        await go(dk, "Failure", {cost: "Reduce Culture by 2 to proceed"});
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costTwoBuildingSite]);
      });

      test(`Failure: Progresses 50% of the amount spent, which can be no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Failure");
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine"]);
      });

      test(`Critical Failure: no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Critical Failure");
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine"]);
      });
    });
    
    test.describe("When already started", () => {
      let setup = async (page, size) => {
        let settlement = {...makeSettlement({size}), powerups: [{name: "Shrine"}, {name: costTwoBuildingSite, type: "building-site", progress: 1, incompleteTemplate: costTwoStructure}]}
        const dk = await DomainkeeperPage.load(page, {...inTurnOne(), level: 2, settlements: [settlement]});
        await dk.setCurrentActor("Bigappel");
        return dk;
      };
      let go = async (dk, outcome, {cost} = {}) => {
        await dk.pickActivity("Build Structure", costTwoStructure, cost || "Reduce Culture by 1 to proceed", "Economy", outcome);
        await dk.setCurrentActor("Bigappel");
      };

      test(`Critical Success: Progresses 150% of the amount spent (round up)`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Critical Success");
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costTwoStructure]);
      });

      test(`Success: Progresses 100% of the amount spent`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Success");
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costTwoStructure]);
      });

      test(`Failure: Progresses 50% of the amount spent, which can be a bit of progress`, async ({ page }) => {
        const dk = await setup(page, "Town");
        await go(dk, "Failure", {cost: "Reduce Culture by 2 to proceed"});
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costTwoStructure]);
      });

      test(`Failure: Progresses 50% of the amount spent, which can be no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Failure");
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costTwoBuildingSite]);
      });

      test(`Critical Failure: no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Critical Failure");
        await expect(dk.currentActorPowerups()).toHaveText(["Shrine", costTwoBuildingSite]);
      });
    });

    test.describe("When upgrading from an existing structure", () => {
      let setup = async (page, size) => {
        let settlement = makeSettlement({size, structures: ["General Store"]});
        const dk = await DomainkeeperPage.load(page, {...inTurnOne(), culture: 4, level: 4, settlements: [settlement]});
        await dk.setCurrentActor("Bigappel");
        return dk;
      };
      let go = async (dk, outcome, {cost} = {}) => {
        await dk.pickActivity("Build Structure", "Marketplace", "Upgrade General Store", cost || "Reduce Culture by 1 to proceed", "Economy", outcome);
        await dk.setCurrentActor("Bigappel");
      };

      test(`Critical Success: Progresses 150% of the amount spent (round up), which can make progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Critical Success");
        await expect(dk.currentActorPowerups()).toHaveText(["General Store", "Incomplete Marketplace (3/5), from General Store"]);
      });

      test(`Critical Success: Progresses 150% of the amount spent (round up), which can complete the build`, async ({ page }) => {
        const dk = await setup(page, "City");
        await go(dk, "Critical Success", {cost: "Reduce Culture by 3 to proceed"});
        await expect(dk.currentActorPowerups()).toHaveText(["Marketplace"]);
      });

      test(`Success: Progresses 100% of the amount spent`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Success");
        await expect(dk.currentActorPowerups()).toHaveText(["General Store", "Incomplete Marketplace (2/5), from General Store"]);
      });

      test(`Failure: Progresses 50% of the amount spent, which can be a bit of progress`, async ({ page }) => {
        const dk = await setup(page, "Town");
        await go(dk, "Failure", {cost: "Reduce Culture by 2 to proceed"});
        await expect(dk.currentActorPowerups()).toHaveText(["General Store", "Incomplete Marketplace (2/5), from General Store"]);
      });

      test(`Failure: Progresses 50% of the amount spent, which can be no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Failure");
        await expect(dk.currentActorPowerups()).toHaveText(["General Store"]);
      });

      test(`Critical Failure: no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Critical Failure");
        await expect(dk.currentActorPowerups()).toHaveText(["General Store"]);
      });
    });
  });
});

test.describe("Cost to Build", () => {
  let highCostStructure = "Keep";
  let setup = async (page, size, ...structures) => {
    let settlement = makeSettlement({size, structures: ["Shrine", ...structures]})
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), culture: 5, level: 3, settlements: [settlement]});
    await dk.setCurrentActor("Bigappel");
    await expect(dk.currentActorPowerups()).toHaveText(["Shrine", ...structures]);
    return dk;
  };
  let go = async (dk, cost) => {
    await dk.pickActivity("Build Structure", highCostStructure, `Reduce Culture by ${cost} to proceed`, "Economy", "Success");
    // TODO check that the higher-cost buttons do not appear
    await dk.setCurrentActor("Bigappel");
  };

  test('By default, reduces an ability you choose by 1', async ({ page }) => {
    const dk = await setup(page, "Village");

    let before = await dk.stat("Culture");
    await go(dk, 1);
    await dk.expectStat("Culture", before - 1);
  });

  test('In a town, you can reduce by 2 instead', async ({ page }) => {
    const dk = await setup(page, "Town");

    let before = await dk.stat("Culture");
    await go(dk, 2);
    await dk.expectStat("Culture", before - 2);
  });

  test('In a city, you can reduce by 3 instead', async ({ page }) => {
    const dk = await setup(page, "City");

    let before = await dk.stat("Culture");
    await go(dk, 3);
    await dk.expectStat("Culture", before - 3);
  });

  test('In a metropolis, you can reduce by 4 instead', async ({ page }) => {
    const dk = await setup(page, "Metropolis");

    let before = await dk.stat("Culture");
    await go(dk, 4);
    await dk.expectStat("Culture", before - 4);
  });

  test('With a Masonic Lodge, payments cost 1 less', async ({ page }) => {
    const dk = await setup(page, "City", "Masonic Lodge");

    let before = await dk.stat("Culture");
    await go(dk, 3);
    await dk.expectStat("Culture", before - 3);
    await expect(dk.currentActorPowerups()).toHaveText(["Shrine", "Masonic Lodge", "Incomplete Keep (4/5)"]);
  });

  test('With a Planning Bureau, payments cost 2 less', async ({ page }) => {
    const dk = await setup(page, "City", "Planning Bureau");

    let before = await dk.stat("Culture");
    await go(dk, 3);
    await dk.expectStat("Culture", before - 3);
    await expect(dk.currentActorPowerups()).toHaveText(["Shrine", "Planning Bureau", "Keep"]);
  });
});

test.describe("Available structures", () => {
  test('are constrained by domain level', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({structures: ["Shrine"]})]});
    await dk.setCurrentActor("Bigappel");

    await dk.pickActivity("Build Structure");
    await expect(dk.currentActivity.decisionPanel("Pick a structure").locator("structure-description .name"))
      .toHaveText(Structure.templates.filter(s => s.level <= 1).map(s => s.name));

    dk.cancelActivity();
    await dk.statInput("Level").fill("2");
    await dk.pickActivity("Build Structure");
    await expect(dk.currentActivity.decisionPanel("Pick a structure").locator("structure-description .name"))
      .toHaveText(Structure.templates.filter(s => s.level <= 2).map(s => s.name));
  });

  test('are constrained by their limit traits', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), level: 2, settlements: [makeSettlement({structures: ["Inn"]})]});
    await dk.setCurrentActor("Bigappel");

    await dk.pickActivity("Build Structure");
    await expect(dk.currentActivity.decisionPanel("Pick a structure").locator(".looks-disabled")).toContainText("Inn");
  });
});

test.describe("Limit by settlement type", () => {
  function makeSettlement({size, structureCount}) {
    return {name: "Bigappel", id: "nyc", traits: [size || "Village"], powerups: Array.from({length: structureCount || 0}, (_, ix) => {return {name: `Generic Block ${ix + 1}`}})};
  }
  let build = async (dk) => {
    await dk.pickActivity("Build Structure", "Shrine", "Reduce Culture by 1 to proceed", "Economy", "Critical Success");
    await dk.setCurrentActor("Bigappel");
  };

  test.describe(`In a Village`, () => {
    let structureCount = 8;

    test(`Town prevented until domain is level 3`, async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({size: "Village", structureCount})]});
      await dk.setCurrentActor("Bigappel");

      await dk.pickActivity("Build Structure");
      await expect(dk.currentActivity.decisionPanel("Pick a structure").description)
        .toContainText("This Village can only contain 8 structures. Domain must be level 3 to build a 9th building and become a Town.");
    });

    test(`Town is allowed at high enough levels`, async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), level: 3, settlements: [makeSettlement({size: "Village", structureCount})]});
      await dk.setCurrentActor("Bigappel");

      await dk.pickActivity("Build Structure");
      await expect(dk.currentActivity.decisionPanel("Pick a structure").description)
        .toContainText(`Choose a structure you want to build. This Village will grow to a Town when you build the 9th structure.`);
    });

    test.describe("With Public Programs, you can have 2 more per settlement", () => {
      let structureCount = 10;
      let feat = "Public Programs";

      test(`Town prevented until domain is level 3`, async ({ page }) => {
        const dk = await DomainkeeperPage.load(page, {...inTurnOne(), feats: [{name: feat}], settlements: [makeSettlement({size: "Village", structureCount})]});
        await dk.setCurrentActor("Bigappel");

        await dk.pickActivity("Build Structure");
        await expect(dk.currentActivity.decisionPanel("Pick a structure").description)
          .toContainText("This Village can only contain 10 structures. Domain must be level 3 to build a 11th building and become a Town.");
      });

      test(`Town is allowed at high enough levels`, async ({ page }) => {
        const dk = await DomainkeeperPage.load(page, {...inTurnOne(), level: 3, feats: [{name: feat}], settlements: [makeSettlement({size: "Village", structureCount})]});
        await dk.setCurrentActor("Bigappel");

        await dk.pickActivity("Build Structure");
        await expect(dk.currentActivity.decisionPanel("Pick a structure").description)
          .toContainText(`Choose a structure you want to build. This Village will grow to a Town when you build the 11th structure.`);
      });
    });
  });

  test.describe(`In a Town`, () => {
    let structureCount = 16;

    test('City prevented until domain is level 9', async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({size: "Town", structureCount})]});
      await dk.setCurrentActor("Bigappel");

      await dk.pickActivity("Build Structure");
      await expect(dk.currentActivity.decisionPanel("Pick a structure").description)
        .toContainText("This Town can only contain 16 structures. Domain must be level 7 to build a 17th building and become a City.");
    });

    test(`City is allowed at high enough levels`, async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), level: 7, settlements: [makeSettlement({size: "Town", structureCount})]});
      await dk.setCurrentActor("Bigappel");

      await dk.pickActivity("Build Structure");
      await expect(dk.currentActivity.decisionPanel("Pick a structure").description)
        .toContainText(`Choose a structure you want to build. This Town will grow to a City when you build the 17th structure.`);
    });
  });

  test.describe(`In a City`, () => {
    let structureCount = 32;

    test('Metropolis prevented until domain is level 15', async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({size: "City", structureCount})]});
      await dk.setCurrentActor("Bigappel");

      await dk.pickActivity("Build Structure");
      await expect(dk.currentActivity.decisionPanel("Pick a structure").description)
        .toContainText("This City can only contain 32 structures. Domain must be level 15 to build a 33rd building and become a Metropolis.");
    });

    test(`Metropolis is allowed at high enough levels`, async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), level: 15, settlements: [makeSettlement({size: "City", structureCount})]});
      await dk.setCurrentActor("Bigappel");

      await dk.pickActivity("Build Structure");
      await expect(dk.currentActivity.decisionPanel("Pick a structure").description)
        .toContainText(`Choose a structure you want to build. This City will grow to a Metropolis when you build the 33rd structure.`);
    });
  });

  test.describe(`In a Metropolis`, () => {
    let structureCount = 64;

    test('Cannot build too many structures', async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({size: "Metropolis", structureCount})]});
      await dk.setCurrentActor("Bigappel");

      await dk.pickActivity("Build Structure");
      await expect(dk.currentActivity.decisionPanel("Pick a structure").description)
        .toContainText("This Metropolis can only contain 64 structures. Domain must be level 21 to build a 67th building and become a Megalopolis.");
    });
  });
});
