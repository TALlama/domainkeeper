const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

const featReducesDC = async (featName, explanation, {modifierName = featName, leadershipActivities = [], civicActivities = [], setup, reduction, selected}) => {
  const activities = [...leadershipActivities, ...civicActivities];
  const activity = activities.random();
  setup = setup || (async ({page, dk}) => {
    if (leadershipActivities.includes(activity)) { await dk.pickLeader() }
    await dk.pickActivity(activity);
  });

  test.describe(`${featName} ${explanation}`, () => {
    function setupWithFeat(page, attrs) {
      return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: featName}]});
    }
  
    test(`affects all uses of ${activities.join("; ")}`, async ({ page }) => {
      const dk = await setupWithFeat(page);
      await setup({page, dk});
      await expect(dk.currentActivity.difficultyClass.options).toContainText([`${modifierName} ${reduction}`]);
      await expect(dk.currentActivity.difficultyClass.selected).toContainText(selected ? [`${modifierName} ${reduction}`]: []);
    });
  });
  
  
};

featReducesDC("Strong Reputation", "is a -2 DC for diplomacy", {
  leadershipActivities: ["Pledge of Fealty", "Request Foreign Aid"],
  reduction: -2,
  selected: true,
});

featReducesDC("Fortified Fiefs", "is a -2 DC when building defenses", {
  leadershipActivities: ["Build Infrastructure"],
  civicActivities: ["Build Structure"],
  modifierName: "Building Fortifications",
  reduction: -2,
  selected: false,
});

featReducesDC("With What You’ve Got", "is a -2 DC to build in difficult terrain", {
  leadershipActivities: ["Build Infrastructure"],
  modifierName: "Difficult Terrain",
  reduction: -2,
  selected: false,
});

featReducesDC("Quick Recovery", "is a -4 DC to end ongoing events", {
  setup: async ({page, dk}) => {
    page.once('dialog', dialog => dialog.accept()); // accept early end of turn
    await dk.earlyEventButton.click();
  },
  modifierName: "Ongoing Event",
  reduction: -4,
  selected: false,
});

