const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

test.describe("Impressive Accoutrements: single-use Loyalty bonus", () => {
  function setupWithFeat(page, attrs) {
    return DomainkeeperPage.load(page, {...onTurnOne(), ...attrs, feats: [{name: "Impressive Accoutrements"}]});
  }
  let activity = ["Build Up", "Cool Down"].random();

  test('gets used by Loyalty rolls', async ({ page }) => {
    const dk = await setupWithFeat(page);

    await dk.pickLeader();
    await dk.pickActivity(activity, "Loyalty", "Success");
    await expect(dk.rollBanners.first()).toContainText("+2 Impressive Accoutrements");
    await expect(dk.topActivity().log).toContainText("Used Impressive Accoutrements");
  });

  test('is not used by rolls for other abilities', async ({ page }) => {
    const dk = await setupWithFeat(page);

    await dk.pickLeader();
    await dk.pickActivity(activity, "Stability", "Success");
    await expect(dk.rollBanners.first()).not.toContainText("+2 Impressive Accoutrements");
    await expect(dk.consumables.names).toContainText(["Impressive Accoutrements"]);
  });
});

test.describe("Unifying Faith: single-use Culture bonus", () => {
  function setupWithFeat(page, attrs) {
    return DomainkeeperPage.load(page, {...onTurnOne(), ...attrs, feats: [{name: "Unifying Faith"}]});
  }
  let activity = ["Build Up", "Cool Down"].random();

  test('gets used by Economy rolls', async ({ page }) => {
    const dk = await setupWithFeat(page);

    await dk.pickLeader();
    await dk.pickActivity(activity, "Culture", "Success");
    await expect(dk.rollBanners.first()).toContainText("+2 Unifying Faith");
    await expect(dk.topActivity().log).toContainText("Used Unifying Faith");
  });

  test('is not used by rolls for other abilities', async ({ page }) => {
    const dk = await setupWithFeat(page);

    await dk.pickLeader();
    await dk.pickActivity(activity, "Stability", "Success");
    await expect(dk.rollBanners.first()).not.toContainText("+2 Unifying Faith");
    await expect(dk.consumables.names).toContainText(["Unifying Faith"]);
  });
});

test.describe("Frugal: single-use Stability bonus", () => {
  function setupWithFeat(page, attrs) {
    return DomainkeeperPage.load(page, {...onTurnOne(), ...attrs, feats: [{name: "Frugal"}]});
  }
  let activity = ["Build Up", "Cool Down"].random();

  test('gets used by Economy rolls', async ({ page }) => {
    const dk = await setupWithFeat(page);

    await dk.pickLeader();
    await dk.pickActivity(activity, "Stability", "Success");
    await expect(dk.rollBanners.first()).toContainText("+2 Frugal");
    await expect(dk.topActivity().log).toContainText("Used Frugal");
  });

  test('is not used by rolls for other abilities', async ({ page }) => {
    const dk = await setupWithFeat(page);

    await dk.pickLeader();
    await dk.pickActivity(activity, "Culture", "Success");
    await expect(dk.rollBanners.first()).not.toContainText("+2 Frugal");
    await expect(dk.consumables.names).toContainText(["Frugal"]);
  });
});

test.describe("Friends of the Wild: single-use Economy bonus", () => {
  function setupWithFeat(page, attrs) {
    return DomainkeeperPage.load(page, {...onTurnOne(), ...attrs, feats: [{name: "Friends of the Wild"}]});
  }
  let activity = ["Build Up", "Cool Down"].random();

  test('gets used by Economy rolls', async ({ page }) => {
    const dk = await setupWithFeat(page);

    await dk.pickLeader();
    await dk.pickActivity(activity, "Economy", "Success");
    await expect(dk.rollBanners.first()).toContainText("+2 Friends of the Wild");
    await expect(dk.topActivity().log).toContainText("Used Friends of the Wild");
  });

  test('is not used by rolls for other abilities', async ({ page }) => {
    const dk = await setupWithFeat(page);

    await dk.pickLeader();
    await dk.pickActivity(activity, "Stability", "Success");
    await expect(dk.rollBanners.first()).not.toContainText("+2 Friends of the Wild");
    await expect(dk.consumables.names).toContainText(["Friends of the Wild"]);
  });
});
