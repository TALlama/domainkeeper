const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require('../domainkeeper_page');
const { onTurnOne } = require('../fixtures/domains');
const { leaders } = require('../fixtures/leaders');

[
  {
    feat: "Constant Exploration",
    pick: [["Clear Hex", "Build Infrastructure"].random()],
  },
  {
    feat: "Trade Broker",
    pick: [["Build Up", "Cool Down"].random()],
  },
  {
    feat: "National Pride",
    pick: [["Quell Unrest", "Take Charge", "New Leadership", "Train Lieutenant"].random()],
  },
  {
    feat: "Unintrusive Builders",
    leader: false,
    pick: ["Build Structure"],
  },
].forEach(({feat, leader=true, pick}) => {
  test.describe(feat, () => {
    function setupWithFeat(page, {attrs={}}={}) {
      return DomainkeeperPage.load(page, {...onTurnOne(), ...attrs, leaders: [leaders.anne], feats: [{name: feat}]});
    }

    test(`discounts an activity`, async ({ page }) => {
      const dk = await setupWithFeat(page);
      await expect(dk.consumables.names).toContainText(["Fame", feat]);

      if (leader) { await dk.pickLeader(); }
      await dk.pickActivity(...pick);

      if (!leader) { await dk.pickSettlement(); }
      await expect(dk.currentActorActivitiesLeft).toHaveText(leader ? "1" : "0");
      await dk.consumables.withName(feat).click();
      await expect(dk.consumables.names).toHaveText(["Fame"]);
      await expect(dk.currentActorActivitiesLeft).toHaveText(leader ? "2" : "1");
    });
  });
});
