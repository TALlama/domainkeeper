const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require('../domainkeeper_page');
const { inTurnOne } = require('../fixtures/domains');

test.describe("Track when a settlement", () => {
  test('has its location updated', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());

    await dk.setActorLocation("Capital", [80, 25]);
    await expect(await dk.nudgeLog()).toContainText("Capital moved to 8");
  });
});
