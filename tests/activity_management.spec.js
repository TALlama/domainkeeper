const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { onTurnOne, inTurnOne, endTurnOne } = require('./fixtures/domains');
const { leaders } = require("./fixtures/leaders");
const { monitor } = require('./helpers');

test.describe("when it's your turn", () => {
  test('you can pick two activities', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...onTurnOne, leaders: leaders.twoPack});

    await monitor({
      shouldNotChange: () => dk.currentActorName,
      when: () => dk.pickActivity("Clear Hex", "Economy", "Success"),
    });

    await monitor({
      shouldChange: () => dk.currentActorName,
      when: () => dk.pickActivity("Build Up", "Culture", "Failure"),
    });
  });

  test('actors must pick two different activities', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: leaders.twoPack});

    await monitor({
      shouldNotChange: () => dk.currentActorName,
      when: () => dk.pickActivity("Clear Hex", "Economy", "Success"),
    });

    await expect(dk.activityPicker.getByRole("button", {name: "Clear Hex"})).toBeDisabled();
  });

  test('initiative set the default order, but you can override it', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: leaders.twoPack}, {expectTurn: "Domain Creation"});

    expect(await dk.currentActorName).toEqual("Anne");
    await monitor({
      shouldChange: () => dk.currentActorName,
      when: () => page.getByText("Ned").click(),
    });
  });

  test('you can always click on an actor to see their stats', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...endTurnOne, leaders: leaders.twoPack});

    expect(await dk.currentActorName).toEqual("Ned");
    await monitor({
      shouldChange: () => dk.currentActorName,
      when: () => dk.leadersList.getByText("Anne").click(),
    });
  });

  test('picking activities lowers the number of activities you have left, but canceling returns them', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...onTurnOne, leaders: [leaders.anne, leaders.zack]});

    await expect(dk.currentActorActivitiesLeft).toHaveText("2");
    expect(await dk.turn("Turn 1").activities).toHaveCount(1);
    await dk.pickActivity("Clear Hex"),
    await expect(dk.currentActorActivitiesLeft).toHaveText("1");
    expect(await dk.turn("Turn 1").activities).toHaveCount(2);
    await dk.cancelActivity();
    await expect(dk.currentActorActivitiesLeft).toHaveText("2");
    expect(await dk.turn("Turn 1").activities).toHaveCount(1);
  });
});
