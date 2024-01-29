const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne, endTurnOne } = require('./fixtures/domains');

test.describe("Saving", () => {
  test('it does not save new domains automatically', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    expect(await dk.savedDomain()).toBeUndefined();
  });

  test('it saves when I tell it to save', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');

    await dk.saveLink.click();
    expect(await dk.savedDomain()).toBeDefined();
  });

  test('it knows if anything has changed', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(endTurnOne);

    await expect(dk.saveLink).toHaveClass("unnecessary");
    await dk.readyEventButton.click();
    await expect(dk.saveLink).not.toHaveClass("unnecessary");
  });

  test('it can clear the saved domain when I tell it to', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);

    await dk.restartLink.click();
    expect(await dk.savedDomain()).toBeUndefined();
  });

  test('saves at the start of each new turn', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');

    await dk.setDomainConcept();
    expect(await dk.savedDomain()).toBeDefined();
  });
});
