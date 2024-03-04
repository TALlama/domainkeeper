const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { leaders } = require("../fixtures/leaders");
const { monitor } = require('../helpers');

let abilities = ["Economy", "Stability"];

test.describe("Increases size", () => {
  let outcomes = ["Critical Success", "Success"];

  test(`On any of the following outcomes: ${outcomes.join("; ")}`, async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    await monitor({
      shouldChange: () => dk.stat("size"),
      when: () => dk.pickActivity("Claim Hex", [50, 50], abilities.random(), outcomes.random()),
    })
  });
});

test.describe("Increases a random ability", () => {
  test('On a critical success', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    let before = await dk.abilitiesTotal();
    await dk.pickActivity("Claim Hex", [50, 50], abilities.random(), "Critical Success");
    expect(await dk.abilitiesTotal()).toEqual(before + 1);
  });
});

test.describe("Does not change size or abilities", () => {
  let outcomes = ["Failure", "Critical Failure"];

  test(`On any of the following outcomes: ${outcomes.join("; ")}`, async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    await monitor({
      shouldNotChange: async () => [await dk.stat("size"), await dk.abilitiesTotal()],
      when: () => dk.pickActivity("Claim Hex", [50, 50], abilities.random(), "Failure"),
    });
  });
});

test.describe("Adds a circumstance penalty", () => {
  test('On a critical failure', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    await dk.pickActivity("Claim Hex", [50, 50], "Economy", "Critical Failure");
    expect(dk.consumables.names).toHaveText(["Disaster"]);
  });
});

test('can be cancelled until you roll', async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: [leaders.anne]});
  await dk.pickLeader();

  await expect(dk.currentActorActivitiesLeft).toHaveText("2");
  await dk.pickActivity("Claim Hex", [50, 50]);
  await expect(dk.currentActorActivitiesLeft).toHaveText("1");
  await dk.cancelActivity();
  await expect(dk.currentActorActivitiesLeft).toHaveText("2");
});

test.describe("Loading", () => {
  test('Shows correctly', async ({ page }) => {
    let saved = {...inTurnOne, leaders: [leaders.anne]};
    saved.turns[1].activities.push({
      "name": "Claim Hex",
      "actorId": leaders.anne.id,
      position: [50, 50],
      location: "OK",
      "ability": "Economy",
      "outcome": "success",
    });
    const dk = await DomainkeeperPage.load(page, saved);
    
    let takeCharge = dk.activity("Claim Hex");
    await expect(takeCharge.root).toHaveAttribute("resolved");
    await expect(takeCharge.decisionPanel("Location").root).toContainText("Location");
    await expect(takeCharge.decisionPanel("Roll").root).toContainText("Roll Economy");
    await expect(takeCharge.decisionPanel("Outcome").root).toContainText("Outcome Success");
  });
});
