const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { testMilestone } = require('./milestones_helper');

testMilestone("Build Infrastructure", {
  domain: inTurnOne,
  criticalSuccess: [[50, 50], ["Road", "Irrigation"].random(), "Stability", "Critical Success"],
  success: [[50, 50], ["Road", "Irrigation"].random(), "Stability", "Success", "Reduce Loyalty by 1 to proceed"],
  failure: [[50, 50], ["Road", "Irrigation"].random(), "Stability", "Failure", "Reduce Loyalty by 2 to proceed"],
});

test.describe("Payment", () => {
  test("Critical Succcess builds for free", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", "Critical Success");
    await expect(dk.topActivity().log).toContainText("The whole domain rallies around this project, and it is complete without cost");
  });

  test("Success costs 1", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), economy: 3});
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", "Success", "Reduce Economy by 1 to proceed");
    await dk.expectStat("economy", 2);
  });

  test("Failure costs 2", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), economy: 3});
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", "Failure", "Reduce Economy by 2 to proceed");
    await dk.expectStat("economy", 1);
  });
});

test.describe("Abandoning the effort", () => {
  test("Allows you to avoid paying, but you don't get the structure", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), economy: 3});
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", ["Success", "Failure"].random(), "Abandon the attempt and pay nothing");
    await dk.expectStat("economy", 3);
    // TODO no structure should be built
  });
});

test.describe("Structures are remembered", () => {
  test("When a structure is built", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
    await dk.pickLeader();

    expect(await dk.featuresAt([50, 50])).toEqual([]);
    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", "Success", "Reduce Economy by 1 to proceed");
    await expect(await dk.featuresAt([50, 50], {find: {name: "Road"}})).toHaveLength(1);
  });
});

test.describe("Structure availability", () => {
  test("Some structures are always available", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50]);
    
    await expect.soft(await dk.findOption("Road")).not.toHaveClass(/looks-disabled/);
    await expect.soft(await dk.findOption("Bridge")).not.toHaveClass(/looks-disabled/);
    await expect.soft(await dk.findOption("Irrigation")).not.toHaveClass(/looks-disabled/);
    await expect.soft(await dk.findOption("Fort")).not.toHaveClass(/looks-disabled/);
  });

  test.describe("Locks", async () => {
    test("Are not available by default", async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, inTurnOne());
      await dk.pickLeader();
      await dk.pickActivity("Build Infrastructure", [50, 50]);
      await expect.soft(await dk.findOption("Locks")).toHaveClass(/looks-disabled/);
    });

    test("Are available with the Channel Locks feat", async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...inTurnOne(), feats: ["Channel Locks"]});
      await dk.pickLeader();
      await dk.pickActivity("Build Infrastructure", [50, 50]);
      await expect.soft(await dk.findOption("Locks")).not.toHaveClass(/looks-disabled/);
    });
  });
});

test.describe("Per-Structure bonuses", () => {
  function setupWithFeat(page, feat, attrs = {}) {
    return DomainkeeperPage.load(page, {...inTurnOne(), ...attrs, feats: [feat]});
  }

  [
    ["Canal Aptitude", "Irrigation", 2],
  ].forEach(([feat, structure, bonus]) => {
    test(`${feat} helps build ${structure}`, async ({ page }) => {
      const dk = await setupWithFeat(page, feat);
      await dk.pickLeader();

      await dk.pickActivity("Build Infrastructure", [50, 50], structure);
      await expect(await dk.findOption("Stability")).toContainText(`${feat}+${bonus}`);

      await dk.unmakeDecision("Structure");
      await dk.makeDecision("Road");
      await expect(await dk.findOption("Stability")).not.toContainText(feat);
    });
  });
});
