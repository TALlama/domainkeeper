const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { testMilestone } = require('./milestones_helper');

testMilestone("Build Infrastructure", {
  domain: {...inTurnOne},
  decisions: [[50, 50], "Stability", "--outcome--"],
});

test.describe("Payment", () => {
  test("Critical Succcess builds for free", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", "Critical Success");
    await expect(dk.topActivity().log).toContainText("The whole domain rallies around this project, and it is complete without cost");
  });

  test("Success costs 1", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, economy: 3});
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", "Success", "Reduce Economy by 1 to proceed");
    expect(await dk.stat("economy")).toEqual(2);
  });

  test("Failure costs 2", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, economy: 3});
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", "Failure", "Reduce Economy by 2 to proceed");
    expect(await dk.stat("economy")).toEqual(1);
  });
});

test.describe("Abandoning the effort", () => {
  test("Allows you to avoid paying, but you don't get the structure", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, economy: 3});
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", ["Success", "Failure"].random(), "Abandon the attempt and pay nothing");
    expect(await dk.stat("economy")).toEqual(3);
    // TODO no structure should be built
  });
});

test.describe("Structures are remembered", () => {
  test("When a structure is built", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    expect(await dk.featuresAt([50, 50])).toEqual([]);
    await dk.pickActivity("Build Infrastructure", [50, 50], "Road", "Stability", "Success", "Reduce Economy by 1 to proceed");
    await expect(await dk.featuresAt([50, 50], {find: {name: "Road"}})).toHaveLength(1);
  });
});

test.describe("Structure availability", () => {
  test("Some structures are always available", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    await dk.pickActivity("Build Infrastructure", [50, 50]);
    
    await expect.soft(await dk.findDecision("Road")).toBeAttached
    await expect.soft(await dk.findDecision("Bridge")).toBeAttached();
    await expect.soft(await dk.findDecision("Fort")).toBeAttached();
  });
});
