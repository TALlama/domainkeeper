const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require('../domainkeeper_page');
const { inTurnOne } = require('../fixtures/domains');

test.describe("Terrain Mastery", () => {
  let terrain = "Mountains";
  let feat = `${terrain} Terrain Mastery`;
  let activities = ["Clear Hex", "Reconnoiter Hex", "Build Infrastructure"];

  function setupWithFeat(page, {attrs={}}={}) {
    return DomainkeeperPage.load(page, {...inTurnOne(), ...attrs, feats: [{name: feat}, {name: "Cheat", bonuses: [{type: "unlock", activity: "Reconnoiter Hex"}]}]});
  }

  test(`"${feat}" reduces DC increase from ${terrain}`, async ({ page }) => {
    const dk = await setupWithFeat(page);

    await dk.pickLeader()
    await dk.pickActivity(activities.random());
    await expect(dk.currentActivity.description).toContainText(`Additional DC modifier based on the hex's worst terrain: Mountains: +3 (reduced from +4); Swamps: +3; Forests: +2; Hills: +1; Plains: +0`)
  });

  test(`"${feat}" reduces DC increase from ${terrain} by 1/4th Economy`, async ({ page }) => {
    const dk = await setupWithFeat(page, {attrs: {economy: 8}});

    await dk.pickLeader()
    await dk.pickActivity(activities.random());
    await expect(dk.currentActivity.description).toContainText(`Additional DC modifier based on the hex's worst terrain: Mountains: +2 (reduced from +4); Swamps: +3; Forests: +2; Hills: +1; Plains: +0`)
  });

  test(`"${feat}" reduces DC increase from ${terrain} to min 0`, async ({ page }) => {
    const dk = await setupWithFeat(page, {attrs: {economy: 80}});

    await dk.pickLeader()
    await dk.pickActivity(activities.random());
    await expect(dk.currentActivity.description).toContainText(`Additional DC modifier based on the hex's worst terrain: Mountains: +0 (reduced from +4); Swamps: +3; Forests: +2; Hills: +1; Plains: +0`)
  });
});
