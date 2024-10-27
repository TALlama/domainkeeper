const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

test.describe("Request Foreign Aid", () => {
  test("can always be used with economy or loyalty", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...onTurnOne()});

    await dk.pickLeader();
    await dk.pickActivity("Request Foreign Aid", ["Economy", "Loyalty"].random());
  });

  test("cannot be used with culture or stability without the right feat", async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...onTurnOne()});

    await dk.pickLeader();
    await dk.pickActivity("Request Foreign Aid");
    await expect(dk.activity("Request Foreign Aid").decisionPanel("Roll").option("Culture")).toHaveClass(/looks-disabled/);
    await expect(dk.activity("Request Foreign Aid").decisionPanel("Roll").option("Stability")).toHaveClass(/looks-disabled/);
  });

  [
    {feat: "Charming Negotiators", ability: "Culture"},
    {feat: "Shameless Call", ability: "Stability"},
  ].forEach(({feat, ability}) => {
    test(`can be used with "${ability}" if you have the "${feat}" feat`, async ({ page }) => {
      const dk = await DomainkeeperPage.load(page, {...onTurnOne(), feats: [{name: feat}]});

      await dk.pickLeader();
      await dk.pickActivity("Request Foreign Aid", ability);
    });
  });
});
