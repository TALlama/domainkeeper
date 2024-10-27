const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require('../fixtures/domains');
const { leaders } = require('../fixtures/leaders');
const { monitor } = require('../helpers');
const { testMilestone } = require('./milestones_helper');

const abilities = ["Loyalty"];
test.describe("Critical Success", () => {
  test('the NPC gains a second activity', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), leaders: [leaders.pc, leaders.npc]});
    await dk.pickLeader();

    await expect(dk.actorActivitiesLeft("Ned")).toHaveText("1");
    await dk.pickActivity("Train Lieutenant", "Ned", "Loyalty", "Critical Success");
    await expect(dk.actorActivitiesLeft("Ned")).toHaveText("2");
  });
});

test.describe("Success", () => {
  test('gives the chosen NPC more activity choices', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), leaders: [leaders.pc, leaders.npc]});
    await dk.pickLeader();

    await dk.pickActivity("Train Lieutenant", "Ned", "Loyalty", "Success");
    // TODO check this
  });
});

test.describe("Failure", () => {
  test('nothing happens', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), leaders: [leaders.pc, leaders.npc]});
    await dk.pickLeader();

    await monitor({
      shouldNotChange: () => dk.actorActivitiesLeft("Ned").textContent(),
      when: () => dk.pickActivity("Train Lieutenant", "Ned", "Loyalty", "Failure"),
    });
  });
});

test.describe("Critical Failure", () => {
  test('trainee abandons their post', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), leaders: [leaders.pc, leaders.npc]});
    await dk.pickLeader();

    await expect(dk.leaderNames).toHaveText(["Anne", "Ned"]);
    await dk.pickActivity("Train Lieutenant", "Ned", "Loyalty", "Critical Failure");
    await expect(dk.leaderNames).toHaveText(["Anne"]);
  });
});

test.describe("Picking an NPC to train", () => {
  test('cannot train yourself', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), leaders: [{...leaders.pc, initiative: 1}, leaders.npc]});
    await dk.pickLeader();

    await dk.pickActivity("Train Lieutenant");

    let activity = dk.currentActivity;
    await activity.retargetWithId();
    await activity.decisionPanel("Trainee").optionButton("Ned").hover({force: true});
    await expect(activity.getByText("Cannot train yourself")).toBeVisible();
  });

  test('if no NPCs are available, lets you know', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), leaders: [leaders.pc]});
    await dk.pickLeader();

    await dk.pickActivity("Train Lieutenant");
    await expect(dk.currentActivity.getByText("There's no one to train")).toBeVisible();
  });
});

test.describe("Cancelling", () => {
  test('can be cancelled until you roll', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), leaders: [leaders.pc, leaders.npc]});
    await dk.pickLeader();

    await expect(dk.currentActorActivitiesLeft).toHaveText("2");
    await dk.pickActivity("Train Lieutenant", "Ned");
    await expect(dk.currentActorActivitiesLeft).toHaveText("1");
    await dk.cancelActivity();
    await expect(dk.currentActorActivitiesLeft).toHaveText("2");
  });
});

test.describe("Loading", () => {
  test('Adds an activity to the selected settlement', async ({ page }) => {
    let saved = {...inTurnOne(), leaders: [leaders.pc, leaders.npc]};
    saved.turns[1].activities.push({
      "name": "Train Lieutenant",
      "actorId": leaders.pc.id,
      "traineeId": leaders.npc.id,
      "ability": "Loyalty",
      "outcome": "success",
    });
    const dk = await DomainkeeperPage.load(page, saved);
    
    let takeCharge = dk.activity("Train Lieutenant");
    await expect(takeCharge.root).toHaveAttribute("resolved");
    await expect(takeCharge.decisionPanel("Trainee").root).toContainText("Trainee Ned");
    await expect(takeCharge.decisionPanel("Roll").root).toContainText("Roll Loyalty");
    await expect(takeCharge.decisionPanel("Outcome").root).toContainText("Outcome Success");
  });
});

testMilestone("Train Lieutenant", {
  domain: () => ({...inTurnOne(), leaders: [leaders.pc, leaders.npc]}),
  decisions: ["Ned", abilities.random(), "--outcome--"],
});
