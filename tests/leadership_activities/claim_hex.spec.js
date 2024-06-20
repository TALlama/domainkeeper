const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { leaders } = require("../fixtures/leaders");
const { monitor } = require('../helpers');
const { testMilestone } = require('./milestones_helper');

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

test.describe("Earns XP", () => {
  let outcomes = ["Critical Success", "Success"];

  test.describe(`On any of the following outcomes: ${outcomes.join("; ")}`, () => {
    test("When hitting a milestone (2, 10, 25, 50, 100)", async ({ page }) => {
      const newSize = [5, 10, 25, 50, 100].random();
      const baseXp = {5: 100, 10: 100, 25: 50, 50: 25, 100: 10}[newSize];
      const milestoneXp = {5: 20, 10: 40, 25: 60, 50: 80, 100: 120}[newSize];

      const dk = await DomainkeeperPage.load(page, {...inTurnOne, size: newSize - 1, milestones: {"First successful Claim Hex": "some-activity-id"}});
      await dk.pickLeader();

      const before = await dk.stat("xp");
      await dk.pickActivity("Claim Hex", [50, 50], abilities.random(), outcomes.random());
      expect(await dk.stat("xp"), `When growing to ${newSize}, should get ${baseXp} + ${milestoneXp} XP (started at ${before})`).toEqual(before + baseXp + milestoneXp);
    });

    test("When NOT hitting a milestone", async ({ page }) => {
      const newSize = [3, 11, 26, 51].random();
      const baseXp = {3: 100, 11: 50, 26: 25, 51: 10, 101: 10}[newSize];

      const dk = await DomainkeeperPage.load(page, {...inTurnOne, size: newSize - 1, milestones: {"First successful Claim Hex": "some-activity-id"}});
      await dk.pickLeader();

      const before = await dk.stat("xp");
      await dk.pickActivity("Claim Hex", [50, 50], abilities.random(), outcomes.random());
      expect(await dk.stat("xp"), `When growing to ${newSize}, should get ${baseXp} XP (started at ${before})`).toEqual(before + baseXp);
    });
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

testMilestone("Claim Hex", {
  domain: {...inTurnOne, size: 2},
  decisions: [[50, 50], abilities.random(), "--outcome--"],
  xp: 120, // 20 for milestone + 100 for growing
});
