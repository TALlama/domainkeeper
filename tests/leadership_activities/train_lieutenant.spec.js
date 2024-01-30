const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require('../fixtures/domains');
const { monitor } = require('../helpers');

let leaders = {
  pc: {name: "Polly", traits: ["PC"], initiative: 20},
  npc: {name: "Ned", traits: ["NPC"], initiative: 10},
};

test.describe("Train Lieutenant", () => {
  test('lets you pick an NPC, then an Ability, then an outcome', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc]});

    await dk.pickActivity("Train Lieutenant", "Ned", "Loyalty", "Success");
  });

  test('cannot train yourself', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [{...leaders.pc, initiative: 1}, leaders.npc]});

    await dk.pickActivity("Train Lieutenant");

    let activity = dk.currentActivity;
    await activity.retargetWithId();
    await activity.decisionPanel("Trainee").optionButton("Ned").hover({force: true});
    await expect(activity.getByText("Cannot train yourself")).toBeVisible();
  });

  test('if no NPCs are available, lets you know', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc]});

    await dk.pickActivity("Train Lieutenant");
    await expect(dk.currentActivity.getByText("There's no one to train")).toBeVisible();
  });

  test('on a critical success, the NPC gains a second activity', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc]});

    expect(dk.leadersList.getByText("Ned 1")).toBeVisible();
    await dk.pickActivity("Train Lieutenant", "Ned", "Loyalty", "Critical Success");
    expect(dk.leadersList.getByText("Ned 2")).toBeVisible();
  });

  test('can be cancelled until you roll', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc]});

    await expect(dk.currentActorActivitiesLeft).toHaveText("2");
    await dk.pickActivity("Train Lieutenant", "Ned");
    await expect(dk.currentActorActivitiesLeft).toHaveText("1");
    await dk.cancelActivity();
    await expect(dk.currentActorActivitiesLeft).toHaveText("2");
  });
});
