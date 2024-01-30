const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne, endTurnOne, allSaved, unSaved } = require('./fixtures/domains');

test.describe("Autosaves", () => {
  test('it does not save new domains automatically', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    expect(await dk.saveSlots.raw()).toBeUndefined();
  });

  test('saves at the start of each new turn', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');

    await dk.setDomainConcept();
    expect(await dk.saveSlots.raw()).toBeDefined();
  });
});

test.describe("Manual saves", () => {
  test('it saves when I tell it to save', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');

    await dk.saveLink.click();
    expect(await dk.saveSlots.raw()).toBeDefined();
  });

  test('it knows if anything has changed', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(allSaved);

    await expect(dk.saveLink).toHaveClass("unnecessary");
    await dk.readyEventButton.click();
    await expect(dk.saveLink).not.toHaveClass("unnecessary");
  });
});

test.describe("Save slots", () => {
  test('can swap to a different save', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.saveSlots.add("domain", {...endTurnOne, name: "Anvilania", culture: 2, economy: 3, loyalty: 4, stability: 5});
    await dk.saveSlots.add("backup", {...endTurnOne, name: "Barbarella", culture: 5, economy: 4, loyalty: 3, stability: 2});
    await page.goto('/');

    await expect(dk.name).toHaveText("Anvilania");
    dk.shouldHaveStats({culture: 2, economy: 3, loyalty: 4, stability: 5});

    await dk.swapToDomain("Barbarella");
    await expect(dk.name).toHaveText("Barbarella");
    dk.shouldHaveStats({culture: 5, economy: 4, loyalty: 3, stability: 2});
  });

  test('when current domain is unsaved, prompts you to save', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.saveSlots.add("domain", {...endTurnOne, name: "Anvilania"});
    await dk.saveSlots.add("backup", {...endTurnOne, name: "Barbarella"});
    await page.goto('/');

    await dk.rename("Aubergine");
    await expect(dk.saveLink).toHaveClass("necessary");

    page.once('dialog', async dialog => { await dialog.accept() }); // save progress before switching
    await dk.swapToDomain("Barbarella");
    await expect(dk.name).toHaveText("Barbarella");
    await expect(dk.saveLink).toHaveClass("unnecessary");

    // now swap back: it should be saved
    await dk.swapToDomain("Aubergine");
    await expect(dk.name).toHaveText("Aubergine");
    await expect(dk.saveLink).toHaveClass("unnecessary");
  });

  test('it can clear the saved domain when I tell it to', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);

    await dk.clearDomain();
    expect(await dk.saveSlots.raw()).toBeUndefined();
  });
});

test.describe("Restart", () => {
  test('when current domain is saved, it just does it', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(allSaved);
    await expect(dk.saveLink).toHaveClass("unnecessary");

    await dk.restartLink.click();
    expect(await dk.saveSlots.raw()).toBeUndefined();
  });

  test('when current domain is unsaved, prompts you to save', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(unSaved);
    await dk.rename("Barbarella");
    await expect(dk.saveLink).toHaveClass("necessary");

    page.once('dialog', async dialog => { await dialog.accept() }); // save progress before switching
    await dk.restartLink.click();
    expect(await dk.saveSlots.raw()).toBeUndefined();
    await expect(dk.saveLink).toHaveClass("unnecessary");

    // now swap back: it should be saved
    await dk.swapToDomain("Barbarella");
    await expect(dk.name).toHaveText("Barbarella");
    await expect(dk.saveLink).toHaveClass("unnecessary");
  });
});
