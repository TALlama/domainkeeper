// @ts-check
const { test, expect } = require('@playwright/test');
const { domainConcepts } = require('./fixtures/activities');
const { DomainkeeperPage } = require("./domainkeeper_page");

test.describe("domain concept is shown on first run", () => {
  test('setting the domain concept builds your abilities, then starts turn 1', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');

    // starting stats
    await dk.shouldHaveStats({
      culture: 2, economy: 2, loyalty: 2, stability: 2,
      unrest: 0, size: 1, xp: 0, level: 1,
    });

    let concept = await dk.currentActivity;

    // each decision bumps a stat by 1. Start with Heartland
    dk.makeDecision('Forest');
    await dk.shouldHaveStats({culture: 3});
    await expect(concept.getByText('Heartland Forest')).toBeVisible();

    // now charter, which is a boost and a free boost
    dk.makeDecision('Conquest');
    await dk.shouldHaveStats({loyalty: 3});
    await expect(concept.getByText('Charter Conquest')).toBeVisible();

    let charterBoost = dk.decisionPanel('Free Charter Boost');
    charterBoost.makeDecision("Loyalty");
    await dk.shouldHaveStats({loyalty: 4});
    await expect(charterBoost.getByText('Free Charter Boost Loyalty')).toBeVisible();

    // govt boosts two stats by 1 each, plus a free boose
    dk.makeDecision('Despotism');
    await dk.shouldHaveStats({economy: 3});
    await dk.shouldHaveStats({stability: 3});
    await expect(page.getByText('Government Despotism')).toBeVisible();

    let govtBoost = dk.decisionPanel('Free Government Boost');
    govtBoost.makeDecision("Loyalty");
    await dk.shouldHaveStats({loyalty: 5});
    await expect(page.getByText('Free Government Boost Loyalty')).toBeAttached(); // hides under previous turn

    // Start of turn 1
    expect(dk.getByText("Turn 1")).toBeVisible();
  });

  test('turn 1 start gives you what you need to begin', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.setDomainConcept();

    // Current Actor is offered activities
    expect(dk.currentActorName).toBeDefined();
    expect(dk.activityPicker.root).toHaveAttribute("open");
    await expect(dk.activityPicker.availableActvities).toHaveCount(17);

    // Consumables refresh each turn
    await expect(dk.consumables.withName("Fame")).toHaveCount(1);
    expect(await dk.consumables.names).toContainText(["Fame"]);
  });

  // TODO after reload, we shouldn't add another welcome + concept to any turn

  test("turn 0 can be injected", async ({page}) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({name: "Whoville",
      culture: 5, economy: 3, loyalty: 3, stability: 3,
      turns: [{activities: [domainConcepts.complete]}],
    });

    await dk.shouldHaveStats({
      culture: 5, economy: 3, loyalty: 3, stability: 3,
      unrest: 0, size: 1, xp: 0, level: 1,
    });

    // Current Actor is offered activities
    expect(dk.currentActorName).toBeDefined();
    expect(dk.activityPicker.root).toHaveAttribute("open");
    await expect(dk.activityPicker.availableActvities).toHaveCount(17);

    // Consumables refresh each turn
    await expect(dk.consumables.withName("Fame")).toHaveCount(1);
    expect(await dk.consumables.names).toContainText(["Fame"]);
  });
});
