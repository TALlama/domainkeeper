const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { monitor } = require('../helpers');

test.describe("Availability", () => {
  test('When size is 1', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    await expect(dk.activityPicker.getByRole("button", {name: "Abandon Hex"})).toBeDisabled();
  });

  test('When size is > 1', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, size: 2});
    await dk.pickLeader();

    await expect(dk.activityPicker.getByRole("button", {name: "Abandon Hex"})).toBeEnabled();
  });
});
