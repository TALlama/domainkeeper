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
    const dk = await DomainkeeperPage.load(page, endTurnOne);

    await dk.readyEventButton.click();
    await eventPicks(dk);
    await expect(dk.getByText("Turn 2", {exact: true})).toBeVisible();
  });

  test('Event might lead to another event', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, endTurnOne);

    await dk.readyEventButton.click();
    await eventPicks(dk, "Add another event");
    await eventPicks(dk, "End turn");
    await expect(dk.getByText("Turn 2", {exact: true})).toBeVisible();
  });

  test('early reqires confirmation before the event', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    page.once('dialog', dialog => dialog.accept()); // accept early end of turn
    await dk.earlyEventButton.click();
    await eventPicks(dk);
    await expect(dk.getByText("Turn 2", {exact: true})).toBeVisible();
  });

  test('adds one fame, unless you already have 3', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, endTurnOne);

    await dk.readyEventButton.click();
    await expect(dk.consumables.names).toContainText([]);
    await eventPicks(dk),
    await expect(dk.consumables.names).toContainText(["Fame"]);
  });

  test('uses up end-of-turn consumables', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, endTurnOne);

    await page.evaluate(() => { document.querySelector("domain-sheet").domain.addConsumable() });
    await expect(dk.consumables.names).toContainText(["Consumable"]);

    await dk.readyEventButton.click();
    await eventPicks(dk);
    await expect(dk.consumables.names).toContainText(["Fame"]);
  });

  test('adds a domain summary to, and collapses, the previous turn', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, endTurnOne);
    
    await expect(dk.turn("Turn 1").activityNames).not.toContainText(["Domain Summary"]);
    await expect(dk.turn("Turn 1").activityNames).toContainText(["News"]);
    await dk.readyEventButton.click();
    await eventPicks(dk);
    await expect(dk.turn("Turn 1").activityNames).toContainText(["Domain Summary"]);
    await expect(dk.turn("Turn 1").activityNames.last()).not.toBeVisible();

    // includes a diff of all abilities and stats since end of last turn
    await expect(dk.turn("Turn 1").locator(".diff")).toContainText("+0 +0 +0 +0 +0 +0 +30 +0".split(" "));
  });

  test('adds a news activity to the new turn', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, endTurnOne);
    
    await expect(dk.turn("Turn 2").activityNames).not.toContainText(["News"]);
    await dk.readyEventButton.click();
    await eventPicks(dk);
    await expect(dk.turn("Turn 2").activityNames).toContainText(["News"]);
  });
});
