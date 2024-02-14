const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { monitor } = require('../helpers');
const { Structure } = require('../../js/models/structure');

let structureNames = {
  starting: "Shrine",
  oneStep: "Cemetery",
  twoStep: "Inn",
  incompleteTwoStep: `Incomplete Inn (1/2)`,
  limited: "Inn",
};

let settlements = {
  withShrine: {name: "Bigappel", id: "nyc", traits: ["Village"], powerups: [{name: structureNames.starting}]},
  withLimitedStructure: {name: "Bigappel", id: "nyc", traits: ["Village"], powerups: [{name: structureNames.limited}]},
  withShrineAndIncompleteInn: {name: "Bigappel", id: "nyc", traits: ["Village"], powerups: [{name: structureNames.starting}, {name: structureNames.incompleteTwoStep, type: "building-site", progress: 1, incompleteTemplate: structureNames.twoStep}]},
};

test.describe("Progresses toward the selected structure", () => {
  test.describe("A cost-one structure", () => {
    let costOneStructure = "Cemetery";
    let progressOutcomes = ["Critical Success", "Success"];
    let noProgressOutcomes = ["Failure", "Critical Failure"];

    test(`Can be built immediately with any of the following outcomes: ${progressOutcomes.join("; ")}`, async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne, settlements: [settlements.withShrine]});
      await dk.setCurrentActor("Bigappel");
  
      await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting]);
      await dk.pickActivity("Build Structure", costOneStructure, "Reduce Culture by 1 to proceed", "Economy", progressOutcomes.random());
      await dk.setCurrentActor("Bigappel");
      await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, costOneStructure]);
    });
    
    test(`On any of the following outcomes: ${noProgressOutcomes.join("; ")}`, async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne, settlements: [settlements.withShrine]});
      await dk.setCurrentActor("Bigappel");

      await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting]);
      await dk.pickActivity("Build Structure", costOneStructure, "Reduce Culture by 1 to proceed", "Economy", noProgressOutcomes.random()),
      await dk.setCurrentActor("Bigappel");
      await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting]);
    });
  });

  test.describe("A higher-cost structure", () => {
    let costOneStructure = "Cemetery";
    let costTwoStructure = "Inn";

    test.describe("On a clean start", () => {
      let setup = async (page) => {
        const dk = await DomainkeeperPage.load(page, {...inTurnOne, settlements: [settlements.withShrine]});
        await dk.setCurrentActor("Bigappel");
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting]);
        return dk;
      };
      let go = async (dk, outcome, {structure, cost} = {}) => {
        await dk.pickActivity("Build Structure", structure || costTwoStructure, cost || "Reduce Culture by 1 to proceed", "Economy", outcome);
        await dk.setCurrentActor("Bigappel");
      };

      test(`Critical Success: Progresses 150% of the amount spent (round up)`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Critical Success");
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, costTwoStructure]);
      });

      test(`Success: Progresses 100% of the amount spent, which can complete a structure`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Success", {structure: costOneStructure});
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, costOneStructure]);
      });

      test(`Success: Progresses 100% of the amount spent, which can end with an incomplete structure`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Success");
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, structureNames.incompleteTwoStep]);
      });

      test.skip(`Failure: Progresses 50% of the amount spent, which can complete the structure`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Failure", {structure: costOneStructure, cost: "Reduce Culture by 2 to proceed"});
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, costOneStructure]);
      });

      test.skip(`Failure: Progresses 50% of the amount spent, which can be a bit of progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Failure", {cost: "Reduce Culture by 2 to proceed"});
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, structureNames.incompleteTwoStep]);
      });

      test(`Failure: Progresses 50% of the amount spent, which can be no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Failure");
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting]);
      });

      test(`Critical Failure: no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Critical Failure");
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting]);
      });
    });
    
    test.describe("When already started", () => {
      let setup = async (page) => {
        const dk = await DomainkeeperPage.load(page, {...inTurnOne, settlements: [settlements.withShrineAndIncompleteInn]});
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
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, costTwoStructure]);
      });

      test(`Success: Progresses 100% of the amount spent`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Success");
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, costTwoStructure]);
      });

      test.skip(`Failure: Progresses 50% of the amount spent, which can be a bit of progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Failure", {cost: "Reduce Culture by 2 to proceed"});
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, costTwoStructure]);
      });

      test(`Failure: Progresses 50% of the amount spent, which can be no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Failure");
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, structureNames.incompleteTwoStep]);
      });

      test(`Critical Failure: no progress`, async ({ page }) => {
        const dk = await setup(page);
        await go(dk, "Critical Failure");
        await expect(dk.currentActorPowerups()).toHaveText([structureNames.starting, structureNames.incompleteTwoStep]);
      });
    });
  });
});

test.describe("Cost to Build", () => {
  let highCostStructure = "Cathedral";
  let setup = async (page, size) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, culture: 5, level: 20, settlements: [{name: "Bigappel", traits: [size]}]});
    await dk.setCurrentActor("Bigappel");
    return dk;
  };
  let go = async (dk, cost) => {
    await dk.pickActivity("Build Structure", highCostStructure, cost || "Reduce Culture by 1 to proceed");
    await dk.setCurrentActor("Bigappel");
  };

  test('In a village, reduces an ability you choose by 1', async ({ page }) => {
    const dk = await setup(page, "Village");

    let before = await dk.stat("Culture");
    await go(dk, "Reduce Culture by 1 to proceed");
    expect(await dk.stat("Culture")).toEqual(before - 1);
  });

  test.skip('In a town, you can reduce by 2 instead', async ({ page }) => {
    const dk = await setup(page, "Town");

    let before = await dk.stat("Culture");
    await go(dk, "Reduce Culture by 2 to proceed");
    expect(await dk.stat("Culture")).toEqual(before - 2);
  });

  test.skip('In a city, you can reduce by 3 instead', async ({ page }) => {
    const dk = await setup(page, "City");

    let before = await dk.stat("Culture");
    await go(dk, "Reduce Culture by 3 to proceed");
    expect(await dk.stat("Culture")).toEqual(before - 3);
  });

  test.skip('In a metropolis, you can reduce by 4 instead', async ({ page }) => {
    const dk = await setup(page, "Metropolis");

    let before = await dk.stat("Culture");
    await go(dk, "Reduce Culture by 4 to proceed");
    expect(await dk.stat("Culture")).toEqual(before - 4);
  });
});

test.describe("Available structures", () => {
  test('are constrained by domain level', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, settlements: [settlements.withShrine]});
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
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, settlements: [settlements.withLimitedStructure]});
    await dk.setCurrentActor("Bigappel");

    await dk.pickActivity("Build Structure");
    await expect(dk.currentActivity.decisionPanel("Pick a structure").locator(".looks-disabled")).toContainText(structureNames.limited);
  });
});
