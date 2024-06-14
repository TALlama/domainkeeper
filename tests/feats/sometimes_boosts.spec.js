const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

test.describe(`Root Work has a 50% chance of giving you a bonus on event rolls`, () => {
  function setupWithFeat(page, {rigDie, attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: `Root Work`}]}, {path: `/?rig-die=${rigDie}`});
  }

  test(`if the die rolls 11 or more`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: [11, 20].random()});

    await expect(dk.activity("News").log).toContainText("Root Work offers protection this turn");
    page.once('dialog', dialog => dialog.accept()); // accept early end of turn
    await dk.earlyEventButton.click();

    await expect(dk.locator(".modifier-breakdown li")).toContainText([
      "Root Work+2", "Root Work+2", "Root Work+2", "Root Work+2",
    ]);
  });

  test(`if the die rolls 10 or less`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: [1, 10].random()});

    await expect(dk.activity("News").log).toContainText("Root Work provides no insight this turn");
    page.once('dialog', dialog => dialog.accept()); // accept early end of turn
    await dk.earlyEventButton.click();

    await expect(dk.locator(".modifier-breakdown li")).not.toContainText(["Root Work+2"]);
  });
});
