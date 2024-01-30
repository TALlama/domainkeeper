const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { monitor } = require('../helpers');
const { Structure } = require('../../js/models/structure');

let settlements = {
  withExtraActivity: {name: "Bigappel", id: "nyc", traits: ["Village"], activitiesPerTurn: 2, powerups: [{name: "Inn"}]},
};

let abilitiesTotal = async (dk) => await dk.stat("Culture") + await dk.stat("Economy") + await dk.stat("Loyalty") + await dk.stat("Stability");

test.describe("Critical Success", () => {
  test('Builds the selected structure', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
    await dk.setCurrentActor("Bigappel");

    await dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Critical Success");
    await expect(dk.currentActorPowerups()).toHaveText(["Inn", "Cemetery"]);
  });

  test('Boosts a random ability (potentially making up for the payment)', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
    await dk.setCurrentActor("Bigappel");

    let before = await abilitiesTotal(dk);
    await dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Critical Success");
    expect(await abilitiesTotal(dk)).toEqual(before - 1 + 1);
  });
});

test.describe("Success", () => {
  test('Builds the selected structure', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
    await dk.setCurrentActor("Bigappel");

    await dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Success");
    await expect(dk.currentActorPowerups()).toHaveText(["Inn", "Cemetery"]);
  });

  test('Reduces an ability you choose by 1', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
    await dk.setCurrentActor("Bigappel");

    let before = await dk.stat("Culture");
    await dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Success");
    expect(await dk.stat("Culture")).toEqual(before - 1);
  });
});

test.describe("Failure", () => {
  test('Does not build anything', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
    await dk.setCurrentActor("Bigappel");

    await monitor({
      shouldNotChange: () => dk.currentActorPowerups().textContent(),
      when: () => dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Failure"),
    });
  });

  test('Still reduces an ability you choose by 1', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
    await dk.setCurrentActor("Bigappel");

    let before = await dk.stat("Culture");
    await dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Failure");
    expect(await dk.stat("Culture")).toEqual(before - 1);
  });
});

test.describe("Critical Failure", () => {
  test('Does not build anything', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
    await dk.setCurrentActor("Bigappel");

    await monitor({
      shouldNotChange: () => dk.currentActorPowerups().textContent(),
      when: () => dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Critical Failure"),
    });
  });

  test('Reduces an ability you choose by 1, and another ability by 1', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
    await dk.setCurrentActor("Bigappel");

    let before = await abilitiesTotal(dk);
    await dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Critical Failure");
    expect(await abilitiesTotal(dk)).toEqual(before - 1 - 1);
  });
});

test.describe("Available structures", () => {
  test('are constrained by domain level', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
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
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, settlements: [settlements.withExtraActivity]});
    await dk.setCurrentActor("Bigappel");

    await dk.pickActivity("Build Structure");
    await expect(dk.currentActivity.decisionPanel("Pick a structure").locator(".looks-disabled")).toContainText("Inn");
  });
});
