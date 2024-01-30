const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { monitor } = require('../helpers');

const unlockedBy = ["Hunters' Lodge", "Explorers' Hall", "Explorers' Guild"];

test.describe("Availability", () => {
  test('When no unlocking structure has been built', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);

    await expect(dk.activityPicker.getByRole("button", {name: "Reconnoiter Hex"})).toBeDisabled();
  });

  test('When an unlocking structure has been built', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({
      ...inTurnOne,
      settlements: [{name: "Starter", traits: "Village", powerups: [{name: unlockedBy[0]}]}],
    });

    await expect(dk.activityPicker.getByRole("button", {name: "Reconnoiter Hex"})).toBeEnabled();
  });
});
