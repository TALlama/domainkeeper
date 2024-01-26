const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { onTurnOne, inTurnOne } = require('./fixtures/domains');
const { monitor } = require('./helpers');

let leaders = {
  anne: {name: "Anne", traits: ["PC"], initiative: 20, activitiesPerTurn: 2},
  zed: {name: "Zed", traits: ["PC"], initiative: 1, activitiesPerTurn: 2},
};

test.describe("when it's your turn", () => {
  test('you can pick two activities', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...onTurnOne, leaders: [leaders.anne, leaders.zed]});

    await monitor({
      shouldNotChange: () => dk.currentActorName,
      when: () => dk.pickActivity("Clear Hex", "Economy", "Success"),
    });

    await monitor({
      shouldChange: () => dk.currentActorName,
      when: () => dk.pickActivity("Work the Land", "Culture", "Failure"),
    });
  });

  test('initiative set the default order, but you can override it', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.anne, leaders.zed]}, "Domain Creation");

    expect(await dk.currentActorName).toEqual("Anne");
    await monitor({
      shouldChange: () => dk.currentActorName,
      when: () => page.getByText("Zed").click(),
    });
  });

  test('picking activities lowers the number of activities you have left, but canceling returns them', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...onTurnOne, leaders: [leaders.anne, leaders.zed]});

    expect(await dk.currentActorActivitiesLeft).toEqual("2");
    expect(await dk.turn("Turn 1").activities).toHaveCount(1);
    await dk.pickActivity("Clear Hex"),
    expect(await dk.currentActorActivitiesLeft).toEqual("1");
    expect(await dk.turn("Turn 1").activities).toHaveCount(2);
    await dk.cancelActivity();
    expect(await dk.currentActorActivitiesLeft).toEqual("2");
    expect(await dk.turn("Turn 1").activities).toHaveCount(1);
  });
});
