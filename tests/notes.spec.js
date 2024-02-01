const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne, endTurnOne } = require('./fixtures/domains');

test.describe("Notes", () => {
  test('can name the domain', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    await expect(dk.name).toHaveText("Founded Yesterday");
    await dk.rename("Anvilania");
    await expect(dk.name).toHaveText("Anvilania");
  });

  test('can rename actors', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: [{name: "Anne", traits: ["PC"]}]});

    await dk.renameLeader("Anne", "Destroyer");
    expect(await dk.currentActorName).toEqual("Destroyer");
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

    await expect(dk.turn(1).activityNames).toHaveText(["Contribute", "Prognostication", "Build Up", "Ruin"]);
    await dk.topActivity().rename("Festival of Fools");
    await expect(dk.turn(1).activityNames).toHaveText(["Festival of Fools", "Prognostication", "Build Up", "Ruin"]);
  });

  test('can change activity summaries', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    await dk.pickActivity("Prognostication");
    await expect(dk.currentActivity.summary).toHaveText("You use the mystic arts to forsee future events and prepare for them.");
    await dk.currentActivity.updateSummary("The best way to predict the future is to invent it");
    await expect(dk.currentActivity.summary).toHaveText("The best way to predict the future is to invent it");
  });
});
