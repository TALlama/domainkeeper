const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

test.describe(`Fame and Fortune grants fame on every critical success`, () => {
  let activityName = ["Build Up", "Cool Down"].random();

  function setupWithFeat(page, {rigDie, attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: `Fame and Fortune`}]}, {path: `/?rig-die=${rigDie}`});
  }

  test(`on a critical success`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: 20});

    await dk.pickLeader();
    await dk.pickActivity(activityName, "Culture", "Critical Success");

    await expect(dk.activity(activityName).log).toContainText("News of this deed spreads far and wide!");
    await expect(dk.consumables.names).toHaveText(["Fame", "Fame"]);
  });

  test(`on any other outcome`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: [1, 10, 19].random()});

    await dk.pickLeader();
    await dk.pickActivity(activityName, "Culture", ["Success", "Failure", "Critical Failure"].random());

    await expect(dk.consumables.names).toHaveText(["Fame"]);
  });
});

