const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require('../domainkeeper_page');
const { onTurnOne, settlements } = require('../fixtures/domains');


test.describe("Community Construction", () => {
  let feat = "Community Construction";
  let costTwoBuildingSite = `Incomplete Library (1/2)`;

  function buildingSite(progress, cost) {
    let name = {
      2: `Library`,
      10: `Boardwalk`,
    }[cost];
    expect(name).toBeDefined();

    return {progress, name, type: "building-site", incompleteTemplate: name};
  }

  function setupWithFeat(page, {attrs={}, settlementPowerups=[]}={}) {
    return DomainkeeperPage.load(page, {
      ...onTurnOne(),
      ...attrs,
      feats: [{name: feat}],
      settlements: [{name: "Bigappel", powerups: settlementPowerups}]});
  }

  test(`continues work on building sites`, async ({ page }) => {
    const site = buildingSite(1, 10);
    const dk = await setupWithFeat(page, {settlementPowerups: [site]});
    
    await expect(dk.currentActorPowerups()).toContainText([`Incomplete ${site.name}`]);
    await expect(dk.topActivity().log).toContainText(/🚧 Incomplete \w+ \(\d\/10\) is now \d+% complete./);
  });

  test(`finishes work on building sites`, async ({ page }) => {
    const site = buildingSite(1, 2);
    const dk = await setupWithFeat(page, {settlementPowerups: [site]});
    
    await expect(dk.currentActorPowerups()).toHaveText([site.name]);
    await expect(dk.topActivity().log).toContainText(`🏛️ Community Construction built the ${site.name}!`);
  });
});
