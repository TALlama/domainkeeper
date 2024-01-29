const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne } = require('./fixtures/domains');

test.describe("Notes", () => {
  test('can name turns', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);

    let turn1 = dk.turn(1);
    await expect(turn1.name).toHaveText("Turn 1");
    await turn1.rename("The Beginning");
    await expect(turn1.name).toHaveText("The Beginning");
  });

  test('can change activity summaries', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);

    await dk.pickActivity("Prognostication");
    await expect(dk.currentActivity.summary).toHaveText("You use the mystic arts to forsee future events and prepare for them.");
    await dk.currentActivity.updateSummary("The best way to predict the future is to invent it");
    await expect(dk.currentActivity.summary).toHaveText("The best way to predict the future is to invent it");
  });
});
