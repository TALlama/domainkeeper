const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

test.describe("Civil Service", () => {
  function setupWithFeat(page) {
    return DomainkeeperPage.load(page, {...onTurnOne, feats: ["Civil Service"]});
  }

  test('gives bonus to settlements', async ({ page }) => {
    const dk = await setupWithFeat(page);
    await expect(dk.consumables.names).toHaveText(["Fame", "Civil Service"]);

    await dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Success");
    await expect(dk.rollBanners.first()).toContainText("+2 Civil Service");
    await expect(dk.consumables.names).toHaveText(["Fame"]);
  });

  test('does not give bonus to leaders', async ({ page }) => {
    const dk = await setupWithFeat(page);
    await expect(dk.consumables.names).toHaveText(["Fame", "Civil Service"]);

    await dk.pickLeader();
    await dk.pickActivity("Build Up", "Economy", "Success");
    await expect(dk.rollBanners.first()).not.toContainText("+2 Civil Service");
    await expect(dk.consumables.names).toHaveText(["Fame", "Civil Service"]);
  });
});

test.describe("Cooperative Leadership", () => {
  function setupWithFeat(page) {
    return DomainkeeperPage.load(page, {...onTurnOne, feats: ["Cooperative Leadership"]});
  }

  test('gives bonus to leaders', async ({ page }) => {
    const dk = await setupWithFeat(page);
    await expect(dk.consumables.names).toHaveText(["Fame", "Cooperative Leadership"]);

    await dk.pickLeader();
    await dk.pickActivity("Build Up", "Economy", "Success");
    await expect(dk.rollBanners.first()).toContainText("+2 Cooperative Leadership");
    await expect(dk.consumables.names).toHaveText(["Fame"]);
  });

  test('does not give bonus to settlements', async ({ page }) => {
    const dk = await setupWithFeat(page);
    await expect(dk.consumables.names).toHaveText(["Fame", "Cooperative Leadership"]);

    await dk.pickActivity("Build Structure", "Cemetery", "Reduce Culture by 1 to proceed", "Economy", "Success");
    await expect(dk.rollBanners.first()).not.toContainText("+2 Cooperative Leadership");
    await expect(dk.consumables.names).toHaveText(["Fame", "Cooperative Leadership"]);
  });
});
