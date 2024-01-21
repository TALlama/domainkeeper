// @ts-check
const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");

test.describe("ending your turn", () => {
  test('starts an event', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    // TODO
  });

  test('early reqires confirmation before the event', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    // TODO
  });

  test('uses up end-of-turn consumables', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    // TODO
  });

  test('adds one fame, unless you already have 3', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    // TODO
  });

  test('adds a domain summary and collapses the previous turn', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    // TODO
  });

  test('adds a ruin to the new turn', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    // TODO
  });
});
