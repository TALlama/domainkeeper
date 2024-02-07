const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne, endTurnOne, allSaved, unSaved } = require('./fixtures/domains');
const { Domain } = require('domain');

test.describe("Autosaves", () => {
  test('it does not save new domains automatically', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page);
    expect(await dk.saveSlots.raw()).toBeUndefined();
  });

  test('saves at the start of each new turn', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page);

    await dk.setCapital();
    await dk.setDomainConcept();
    expect(await dk.saveSlots.raw()).toBeDefined();
  });
});

test.describe("Manual saves", () => {
  test('it saves when I tell it to save', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page);

    await dk.saveLink.click();
    expect(await dk.saveSlots.raw()).toBeDefined();
  });

  test('it knows if anything has changed', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, allSaved);

    await expect(dk.saveLink).toHaveClass(/\bunnecessary\b/);
    await dk.readyEventButton.click();
    await expect(dk.saveLink).not.toHaveClass(/\bunnecessary\b/);
  });
});

test.describe("Save slots", () => {
  test('can swap to a different save', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page);
    await dk.saveSlots.add("domain", {...endTurnOne, name: "Anvilania", culture: 2, economy: 3, loyalty: 4, stability: 5});
    await dk.saveSlots.add("backup", {...endTurnOne, name: "Barbarella", culture: 5, economy: 4, loyalty: 3, stability: 2});
    await page.goto('/');

    await expect(dk.name).toHaveText("Anvilania");
    await dk.shouldHaveStats({culture: 2, economy: 3, loyalty: 4, stability: 5});

    await dk.swapToDomain("Barbarella");
    await expect(dk.name).toHaveText("Barbarella");
    await dk.shouldHaveStats({culture: 5, economy: 4, loyalty: 3, stability: 2});
  });

  test('when current domain is unsaved, prompts you to save', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page);
    await dk.saveSlots.add("domain", {...endTurnOne, name: "Anvilania"});
    await dk.saveSlots.add("backup", {...endTurnOne, name: "Barbarella"});
    await page.goto('/');

    await dk.rename("Aubergine");
    await expect(dk.saveLink).toHaveClass(/\bnecessary\b/);

    page.once('dialog', async dialog => { await dialog.accept() }); // save progress before switching
    await dk.swapToDomain("Barbarella");
    await expect(dk.name).toHaveText("Barbarella");
    await expect(dk.saveLink).toHaveClass(/\bunnecessary\b/);

    // now swap back: it should be saved
    await dk.swapToDomain("Aubergine");
    await expect(dk.name).toHaveText("Aubergine");
    await expect(dk.saveLink).toHaveClass(/\bunnecessary\b/);
  });

  test('it can clear the saved domain when I tell it to', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    await dk.clearDomain();
    expect(await dk.saveSlots.raw()).toBeUndefined();
  });
});

test.describe("Restart", () => {
  test('when current domain is saved, it just does it', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, allSaved);
    await expect(dk.saveLink).toHaveClass(/\bunnecessary\b/);

    await dk.swapLink.click();
    await dk.getByRole("button", {name: "New Domain"}).click();
    expect(await dk.saveSlots.raw()).toBeUndefined();
  });

  test('when current domain is unsaved, prompts you to save', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, unSaved);
    await dk.rename("Barbarella");
    await expect(dk.saveLink).toHaveClass(/\bnecessary\b/);

    page.once('dialog', async dialog => { await dialog.accept() }); // save progress before switching
    await dk.swapLink.click();
    await dk.getByRole("button", {name: "New Domain"}).click();

    expect(await dk.saveSlots.raw()).toBeUndefined();
    await expect(dk.saveLink).toHaveClass(/\bunnecessary\b/);

    // now swap back: it should be saved
    await dk.swapToDomain("Barbarella");
    await expect(dk.name).toHaveText("Barbarella");
    await expect(dk.saveLink).toHaveClass(/\bunnecessary\b/);
  });
});

test.describe("Importing", () => {
  test('when current domain is saved, it just does it', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, allSaved);
    await expect(dk.saveLink).toHaveClass(/\bunnecessary\b/);

    await dk.swapLink.click();
    await dk.getByRole("button", {name: "Import Domain"}).click();
    await dk.getByLabel("Domain JSON").fill(JSON.stringify({name: "My Great Domain"}));
    await dk.getByRole("button", {name: "Import"}).click();
    await expect(dk.name).toHaveText("My Great Domain");
    expect(await dk.saveSlots.raw()).toBeDefined();
  });
});
