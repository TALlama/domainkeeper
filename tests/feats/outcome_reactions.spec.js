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

test.describe(`Cautious Creativity ignores one Critical Failure a turn for Creative Solution`, () => {
  let activityName = "Creative Solution";

  function setupWithFeat(page, {rigDie, attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: `Cautious Creativity`}]}, {path: `/?rig-die=${rigDie}`});
  }

  test(`on a critical failure`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: 1});
    await expect(dk.consumables.names).toHaveText(["Fame", "Cautious Creativity"]);

    await dk.pickLeader();
    await dk.pickActivity(activityName, "Culture");

    await expect(dk.activity(activityName).log).toContainText("Cautious Creativity helps avoid disaster.");
    await expect(dk.consumables.names).toHaveText(["Fame"]);
  });
});

test.describe(`Cooperative Mindset ignores one Critical Failures per turn`, () => {
  let activityName = ["Build Up", "Cool Down"].random();

  function setupWithFeat(page, {rigDie, attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: `Cooperative Mindset`}]}, {path: `/?rig-die=${rigDie}`});
  }

  test(`on a critical failure`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: 1});
    await expect(dk.consumables.names).toHaveText(["Fame", "Cooperative Mindset"]);

    await dk.pickLeader();
    await dk.pickActivity(activityName, "Culture");

    await expect(dk.activity(activityName).log).toContainText("Cooperative Mindset helps avoid disaster.");
    await expect(dk.consumables.names).toHaveText(["Fame"]);
  });
});

