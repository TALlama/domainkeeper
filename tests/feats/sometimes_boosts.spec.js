const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

test.describe(`Root Work has a 50% chance of giving you a bonus on event rolls`, () => {
  function setupWithFeat(page, {rigDie, attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne(), ...attrs, feats: [{name: `Root Work`}]}, {path: `/?rig-die=${rigDie}`});
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

test.describe(`Practical Magic has a 50% chance of giving you a magical solution`, () => {
  function setupWithFeat(page, {rigDie, additionalFeats=[], attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne(), ...attrs, feats: [{name: `Practical Magic`}, ...additionalFeats]}, {path: `/?rig-die=${rigDie}`});
  }

  test(`if the die rolls 11 or more`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: [11, 20].random()});

    await expect(dk.activity("News").log).toContainText("Practical Magic offers intriguing possibilities");
    page.once('dialog', dialog => dialog.accept()); // accept early end of turn
    await dk.earlyEventButton.click();

    await expect(dk.consumables.names).toContainText(["Magical Solution"]);
  });

  test(`if the die rolls 10 or less`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: [1, 10].random()});

    await expect(dk.activity("News").log).toContainText("Practical Magic is always nice, but can't help this turn");
    page.once('dialog', dialog => dialog.accept()); // accept early end of turn
    await dk.earlyEventButton.click();

    await expect(dk.consumables.names).not.toContainText(["Magical Solution"]);
  });

  test.describe("with Mystic Utopia", () => {
    test(`success on 6+`, async ({ page }) => {
      const dk = await setupWithFeat(page, {additionalFeats: [{name: `Mystic Utopia`}], rigDie: 6});

      await expect(dk.activity("News").log).toContainText("Practical Magic offers intriguing possibilities");
      page.once('dialog', dialog => dialog.accept()); // accept early end of turn
      await dk.earlyEventButton.click();

      await expect(dk.consumables.names).toContainText(["Magical Solution"]);
    });

    test(`failure on 5-`, async ({ page }) => {
      const dk = await setupWithFeat(page, {additionalFeats: [{name: `Mystic Utopia`}], rigDie: [1, 5].random()});

      await expect(dk.activity("News").log).toContainText("Practical Magic is always nice, but can't help this turn");
      page.once('dialog', dialog => dialog.accept()); // accept early end of turn
      await dk.earlyEventButton.click();

      await expect(dk.consumables.names).not.toContainText(["Magical Solution"]);
    });
  });
});
