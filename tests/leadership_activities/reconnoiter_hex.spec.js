const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { testMilestone } = require('./milestones.spec');

const abilities = ["Economy", "Stability"];
const unlockedBy = ["Hunters' Lodge", "Explorers' Hall", "Explorers' Guild"];

test.describe("Availability", () => {
  test('When no unlocking structure has been built', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    await expect(dk.activityPicker.getByRole("button", {name: "Reconnoiter Hex"})).toBeDisabled();
  });

  test('When an unlocking structure has been built', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {
      ...inTurnOne,
      settlements: [{name: "Starter", traits: "Village", powerups: [{name: unlockedBy[0]}]}],
    });
    await dk.pickLeader();

    await expect(dk.activityPicker.getByRole("button", {name: "Reconnoiter Hex"})).toBeEnabled();
  });
});

testMilestone("Reconnoiter Hex", {
  domain: {...inTurnOne, settlements: [{name: "Starter", traits: "Village", powerups: [{name: unlockedBy[0]}]}]},
  decisions: [[50, 50], abilities.random(), "--outcome--"],
});
