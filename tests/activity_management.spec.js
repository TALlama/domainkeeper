const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { onTurnOne, inTurnOne, endTurnOne } = require('./fixtures/domains');
const { leaders } = require("./fixtures/leaders");
const { monitor } = require('./helpers');

test.describe("when it's a leader's turn", () => {
  test('you can pick two activities', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: leaders.twoPack});
    await dk.useSettlementActivities();

    await expect(dk.currentActorName).toHaveText("Anne");
    await dk.pickActivity("Clear Hex", [50, 50], "Economy", "Success");
    await expect(dk.currentActorName).toHaveText("Anne");
    
    await dk.pickActivity("Build Up", "Culture", "Failure");
    await expect(dk.currentActorName).toHaveText("Ned");
  });

  test('actors must pick two different activities', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: leaders.twoPack});
    await dk.useSettlementActivities();

    await expect(dk.currentActorName).toHaveText("Anne");
    await dk.pickActivity("Clear Hex", [50, 50], "Economy", "Success"),
    await expect(dk.activityPicker.getByRole("button", {name: "Clear Hex"})).toBeDisabled();
  });

  test('initiative set the default order, but you can override it', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: leaders.twoPack}, {expectTurn: "Domain Creation"});
    await dk.useSettlementActivities();

    await expect(dk.currentActorName).toHaveText("Anne");
    await dk.setCurrentActor("Ned");
    await expect(dk.currentActorName).toHaveText("Ned");
  });

  test('you can always click on an actor to see their stats', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...endTurnOne, leaders: leaders.twoPack});

    await expect(dk.currentActorName).toHaveText("Ned");
    await dk.leadersList.getByText("Anne").click(),
    await expect(dk.currentActorName).toHaveText("Anne");
  });

  test('picking activities lowers the number of activities you have left, but canceling returns them', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...onTurnOne, leaders: [leaders.anne, leaders.zack]});
    await dk.useSettlementActivities();

    await expect(dk.currentActorActivitiesLeft).toHaveText("2");
    await expect(await dk.turn("Turn 1").activities).toHaveCount(2);
    await dk.pickActivity("Clear Hex"),
    await expect(dk.currentActorActivitiesLeft).toHaveText("1");
    await expect(await dk.turn("Turn 1").activities).toHaveCount(3);
    await dk.cancelActivity();
    await expect(dk.currentActorActivitiesLeft).toHaveText("2");
    await expect(await dk.turn("Turn 1").activities).toHaveCount(2);
  });
});
