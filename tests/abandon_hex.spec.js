const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne } = require("./fixtures/domains");
const { monitor } = require('./helpers');

test.describe("Availability", () => {
  test('When size is 1', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);

    await expect(dk.activityPicker.getByRole("button", {name: "Abandon Hex"})).toBeDisabled();
  });

  test('When size is > 1', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, size: 2});

    await expect(dk.activityPicker.getByRole("button", {name: "Abandon Hex"})).toBeEnabled();
  });
});
