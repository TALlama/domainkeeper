const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

test.describe("Service Reform reduces unrest by loyalty/5 every turn", () => {
  function setupWithFeat(page, attrs) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: "Service Reform"}]});
  }

  test('rounds up to the nearest whole number', async ({ page }) => {
    const dk = await setupWithFeat(page, {loyalty: 1, unrest: 4});
    expect(await dk.stat("Unrest")).toEqual(4 - 1); // down by 1/5, round up
    //await expect(dk.topActivity().log).toContainText("Reduced unrest by 1, to 3");
  });

  test('can reduce unrest by > 1', async ({ page }) => {
    const dk = await setupWithFeat(page, {loyalty: 10, unrest: 4});
    expect(await dk.stat("Unrest")).toEqual(4 - 2); // down by 10/5
    //await expect(dk.topActivity().log).toContainText("Reduced unrest by 2, to 2");
  });
});

test.describe("Inspiring Entertainment reduces unrest by culture/5 every turn", () => {
  function setupWithFeat(page, attrs) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: "Inspiring Entertainment"}]});
  }

  test('rounds up to the nearest whole number', async ({ page }) => {
    const dk = await setupWithFeat(page, {culture: 1, unrest: 4});
    expect(await dk.stat("Unrest")).toEqual(4 - 1); // down by 1/5, round up
    //await expect(dk.topActivity().log).toContainText("Reduced unrest by 1, to 3");
  });

  test('can reduce unrest by > 1', async ({ page }) => {
    const dk = await setupWithFeat(page, {culture: 10, unrest: 4});
    expect(await dk.stat("Unrest")).toEqual(4 - 2); // down by 10/5
    //await expect(dk.topActivity().log).toContainText("Reduced unrest by 2, to 2");
  });
});

test.describe("Continual Care reduces unrest by stability/5 every turn", () => {
  function setupWithFeat(page, attrs) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: "Continual Care"}]});
  }

  test('rounds up to the nearest whole number', async ({ page }) => {
    const dk = await setupWithFeat(page, {stability: 1, unrest: 4});
    expect(await dk.stat("Unrest")).toEqual(4 - 1); // down by 1/5, round up
    //await expect(dk.topActivity().log).toContainText("Reduced unrest by 1, to 3");
  });

  test('can reduce unrest by > 1', async ({ page }) => {
    const dk = await setupWithFeat(page, {stability: 10, unrest: 4});
    expect(await dk.stat("Unrest")).toEqual(4 - 2); // down by 10/5
    //await expect(dk.topActivity().log).toContainText("Reduced unrest by 2, to 2");
  });
});
