const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");

let leaders = {
  anne: {name: "Anne", id: "leader-anne", traits: ["PC"], initiative: 20},
};
let settlements = {
  capital: {name: "Capital", id: "settlement-capital", traits: ["Village"]},
};

test.describe("Critical success", () => {
  test('Adds an activity to the selected settlement', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    await expect(dk.actorActivitiesLeft("Capital")).toHaveText("1");
    await dk.pickActivity("Take Charge", "Capital", "Economy", "Critical Success");
    await expect(dk.actorActivitiesLeft("Capital")).toHaveText("2");
  });

  test('Increases stability or loyalty at random', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let before = await dk.stat('Loyalty') + await dk.stat('Stability');
    await dk.pickActivity("Take Charge", "Capital", "Economy", "Critical Success");
    let after = await dk.stat('Loyalty') + await dk.stat('Stability');
    expect(after).toEqual(before + 1);
  });
});

test.describe("Success", () => {
  test('Adds an activity to the selected settlement', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    await expect(dk.actorActivitiesLeft("Capital")).toHaveText("1");
    await dk.pickActivity("Take Charge", "Capital", "Economy", "Success");
    await expect(dk.actorActivitiesLeft("Capital")).toHaveText("2");
  });
});

test.describe("Failure", () => {
  test('Adds an activity to the selected settlement', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    await expect(dk.actorActivitiesLeft("Capital")).toHaveText("1");
    await dk.pickActivity("Take Charge", "Capital", "Economy", "Failure");
    await expect(dk.actorActivitiesLeft("Capital")).toHaveText("2");
  });

  test('Increases unrest', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let before = await dk.stat('Unrest');
    await dk.pickActivity("Take Charge", "Capital", "Economy", "Failure");
    expect(await dk.stat('Unrest')).toBe(before + 1);
  });
});

test.describe("Critical Failure", () => {
  test('Increases unrest', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let before = await dk.stat('Unrest');
    await dk.pickActivity("Take Charge", "Capital", "Economy", "Critical Failure");
    expect(await dk.stat('Unrest')).toBe(before + 1);
  });

  test('Decreases stability or loyalty at random', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let before = await dk.stat('Loyalty') + await dk.stat('Stability');
    await dk.pickActivity("Take Charge", "Capital", "Economy", "Critical Failure");
    let after = await dk.stat('Loyalty') + await dk.stat('Stability');
    expect(after).toEqual(before - 1);
  });
});

test('can be cancelled until you roll', async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: [leaders.anne]});

  await expect(dk.currentActorActivitiesLeft).toHaveText("2");
  await dk.pickActivity("Take Charge", "Capital");
  await expect(dk.currentActorActivitiesLeft).toHaveText("1");
  await dk.cancelActivity();
  await expect(dk.currentActorActivitiesLeft).toHaveText("2");
});

test.describe("Loading", () => {
  test('Adds an activity to the selected settlement', async ({ page }) => {
    let saved = {...inTurnOne, leaders: [leaders.anne], settlements: [settlements.capital]};
    saved.turns[1].activities.push({
      "name": "Take Charge",
      "actorId": leaders.anne.id,
      "settlementId": settlements.capital.id,
      "ability": "Economy",
      "outcome": "success",
    });
    const dk = await DomainkeeperPage.load(page, saved);
    
    let takeCharge = dk.activity("Take Charge");
    await expect(takeCharge.root).toHaveAttribute("resolved");
    await expect(takeCharge.decisionPanel("Settlement").root).toContainText("Settlement Capital");
    await expect(takeCharge.decisionPanel("Roll").root).toContainText("Roll Economy");
    await expect(takeCharge.decisionPanel("Outcome").root).toContainText("Outcome Success");
  });
});
