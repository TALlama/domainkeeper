const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

test.describe(`Fame and Fortune grants fame on every critical success`, () => {
  let activityName = ["Build Up", "Cool Down"].random();

  function setupWithFeat(page, {rigDie, attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: `Fame and Fortune`}]}, {path: `/?rig-die=${rigDie}`});
  }

  test(`on a critical success`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: 20});

    await dk.pickLeader();
    await dk.pickActivity(activityName, "Culture", "Critical Success");

    await expect(dk.activity(activityName).log).toContainText("News of this deed spreads far and wide!");
    await expect(dk.consumables.names).toHaveText(["Fame", "Fame"]);
  });

  test(`on any other outcome`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: [1, 10, 19].random()});

    await dk.pickLeader();
    await dk.pickActivity(activityName, "Culture", ["Success", "Failure", "Critical Failure"].random());

    await expect(dk.consumables.names).toHaveText(["Fame"]);
  });
});

test.describe(`Cautious Creativity ignores one Critical Failure a turn for Creative Solution`, () => {
  let activityName = "Creative Solution";

  function setupWithFeat(page, {rigDie, attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: `Cautious Creativity`}]}, {path: `/?rig-die=${rigDie}`});
  }

  test(`on a critical failure`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: 1});
    await expect(dk.consumables.names).toHaveText(["Fame", "Cautious Creativity"]);

    await dk.pickLeader();
    await dk.pickActivity(activityName, "Culture");

    await expect(dk.activity(activityName).log).toContainText("Cautious Creativity helps avoid disaster.");
    await expect(dk.consumables.names).toHaveText(["Fame"]);
  });
});

test.describe(`Cooperative Mindset ignores one Critical Failures per turn`, () => {
  let activityName = ["Build Up", "Cool Down"].random();

  function setupWithFeat(page, {rigDie, attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: `Cooperative Mindset`}]}, {path: `/?rig-die=${rigDie}`});
  }

  test(`on a critical failure`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: 1});
    await expect(dk.consumables.names).toHaveText(["Fame", "Cooperative Mindset"]);

    await dk.pickLeader();
    await dk.pickActivity(activityName, "Culture");

    await expect(dk.activity(activityName).log).toContainText("Cooperative Mindset helps avoid disaster.");
    await expect(dk.consumables.names).toHaveText(["Fame"]);
  });
});

[
  ["Cultural Signature", {
    activities: ["Build Up", "Quell Unrest"],
    abilities: ["Culture"]}],
  ["Cohesive Traditions", {
    activities: ["Take Charge"],
    decisions: ["Capital"],
    abilities: ["Stability"]}],
  ["Cohesive Traditions", {
    activities: ["Quell Unrest"],
    abilities: ["Stability"]}],
  ["Impeccable Builders", {
    leader: false,
    affectsOutcomes: ["Success"],
    activities: ["Build Structure"],
    decisions: ["Cemetery", "Reduce Culture by 1 to proceed"],
    abilities: ["Economy"]}],
].forEach(([feat, {leader=true, affectsOutcomes=["Success", "Failure", "Critical Failure"], activities, abilities, decisions=[]}]) => {
  let activityName = activities.random();
  let ability = abilities.random();

  test.describe(`${feat} ${decisions.join(" > ")} boosts outcomes`, () => {
    function setupWithFeat(page, {rigDie, attrs={}}={}) {
      return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: feat}]}, {path: `/?rig-die=${rigDie}`});
    }

    test(`ignores critical successes`, async ({ page }) => {
      const naturalOutcome = "Critical Success";
      const dk = await setupWithFeat(page, {rigDie: 20});

      if (leader) { await dk.pickLeader() }
      await dk.pickActivity(activityName, ...decisions);
      await expect(await dk.findOption(ability)).toContainText(`${feat}⏫`);
      await dk.makeDecision(ability);

      await expect.soft(await dk.findOption(naturalOutcome)).toHaveClass(/hinted/);
    });

    test(`boosts the outcome one level`, async ({ page }) => {
      const naturalOutcome = affectsOutcomes.random();
      const boostedOutcome = {Success: "Critical Success", Failure: "Success", "Critical Failure": "Failure"}[naturalOutcome];
      const rigDie = {Success: 13, Failure: 2, "Critical Failure": 1}[naturalOutcome];
      const dk = await setupWithFeat(page, {rigDie});

      if (leader) { await dk.pickLeader() }
      await dk.pickActivity(activityName, ...decisions);
      await expect(await dk.findOption(ability)).toContainText(`${feat}⏫`);
      await dk.makeDecision(ability);

      await expect(dk.activity(activityName).log).toContainText(`${feat} boosts the outcome to ${boostedOutcome}.`);
      await expect.soft(await dk.findOption(boostedOutcome)).toHaveClass(/hinted/);
    });
  });
});
