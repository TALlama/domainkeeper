const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { endTurnOne, inTurnOne } = require("./fixtures/domains");
const { monitor } = require('./helpers');

async function eventPicks(dk, finalPick = "End turn") {
  await expect((await dk.currentActivity).locator(".activity-name", {name: "Event"})).toBeVisible();
  await dk.makeDecisions(["Culture", "Success", "Nothing happened"]);
  return dk.currentActivity.makeDecision(finalPick);
}

test.describe("You can end your turn", () => {
  test('When all activities are complete, by triggering and resolving an event', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(endTurnOne);

    await dk.readyEventButton.click();
    await eventPicks(dk);
    await expect(dk.getByText("Turn 2", {exact: true})).toBeVisible();
  });

  test('Event might lead to another event', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(endTurnOne);

    await dk.readyEventButton.click();
    await eventPicks(dk, "Add another event");
    await eventPicks(dk, "End turn");
    await expect(dk.getByText("Turn 2", {exact: true})).toBeVisible();
  });

  test('early reqires confirmation before the event', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);

    page.on('dialog', dialog => dialog.accept()); // accept early end of turn
    await dk.earlyEventButton.click();
    await eventPicks(dk);
    await expect(dk.getByText("Turn 2", {exact: true})).toBeVisible();
  });

  test('adds one fame, unless you already have 3', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(endTurnOne);

    await dk.readyEventButton.click();
    expect(await dk.consumables.names).toEqual([]);
    await eventPicks(dk),
    expect(await dk.consumables.names).toEqual(["Fame"]);
  });

  test('uses up end-of-turn consumables', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(endTurnOne);

    await page.evaluate(() => { document.querySelector("domain-sheet").domain.addConsumable() });
    expect(await dk.consumables.names).toEqual(["Consumable"]);

    await dk.readyEventButton.click();
    await eventPicks(dk);
    expect(await dk.consumables.names).toEqual(["Fame"]);
  });

  test('adds a domain summary to, and collapses, the previous turn', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(endTurnOne);
    
    expect(dk.turn("Turn 1").activity("Domain Summary").root).toHaveCount(0);
    expect(dk.turn("Turn 1").activity("Ruin").root).toBeVisible();
    await dk.readyEventButton.click();
    await eventPicks(dk);
    expect(dk.turn("Turn 1").activity("Domain Summary").root).toBeVisible();
    expect(dk.turn("Turn 1").activity("Ruin").root).not.toBeVisible();
  });

  test('adds a ruin to the new turn', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(endTurnOne);
    
    expect(dk.turn("Turn 2").activity("Ruin").root).toHaveCount(0);
    await dk.readyEventButton.click();
    await eventPicks(dk);
    expect(dk.turn("Turn 2").activity("Ruin").root).toBeVisible();
  });
});
