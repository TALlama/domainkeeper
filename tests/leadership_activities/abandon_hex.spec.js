const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require("../fixtures/domains");
const { testMilestone } = require('./milestones_helper');
const { monitor } = require('../helpers');

test.describe("Availability", () => {
  test('When size is 1', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
    await dk.pickLeader();

    await expect(dk.activityPicker.getByRole("button", {name: "Abandon Hex"})).toBeDisabled();
  });

  test('When size is > 1', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), size: 2});
    await dk.pickLeader();

    await expect(dk.activityPicker.getByRole("button", {name: "Abandon Hex"})).toBeEnabled();
  });
});

testMilestone("Abandon Hex", {
  domain: () => ({...inTurnOne(), size: 2}),
  decisions: [[50, 50], "Stability", "--outcome--"],
});
