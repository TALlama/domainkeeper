const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne, endTurnOne } = require('./fixtures/domains');
const { leaders } = require('./fixtures/leaders');

test.describe("Notes", () => {
  test('can name the domain', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    await expect(dk.name).toHaveText("Founded Yesterday");
    await dk.rename("Anvilania");
    await expect(dk.name).toHaveText("Anvilania");
  });

  test('can rename leaders', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: [leaders.anne]});

    await dk.renameActor("Anne", "Destroyer");
    await expect(dk.currentActorName).toHaveText("Destroyer");
  });

  test('can name turns', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let turn1 = dk.turn(1);
    await expect(turn1.name).toHaveText("Turn 1");
    await turn1.rename("The Beginning");
    await expect(turn1.name).toHaveText("The Beginning");
  });

  test('can rename activities taken', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, endTurnOne);

    await expect(dk.turn(1).activityNames).toHaveText(["Prognostication", "Build Up", "Contribute", "News"]);
    await dk.topActivity().rename("Farsight Ceremony");
    await expect(dk.turn(1).activityNames).toHaveText(["Farsight Ceremony", "Build Up", "Contribute", "News"]);
  });

  test('can change activity summaries', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.pickLeader();

    await dk.pickActivity("Prognostication");
    await expect(dk.currentActivity.summary).toHaveText("You use the mystic arts to forsee future events and prepare for them.");
    await dk.currentActivity.updateSummary("The best way to predict the future is to invent it");
    await expect(dk.currentActivity.summary).toHaveText("The best way to predict the future is to invent it");
  });
});
