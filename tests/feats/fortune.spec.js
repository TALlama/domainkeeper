const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');
const { Ability } = require('../../js/models/abilities');

[
  //********************************************/
  // Level 15: One ability on multiple activities
  {feat: "Artistic Hub", pick: ["Build Up"], ability: "Culture"},
  {feat: "Artistic Hub", pick: ["Cool Down"], ability: "Culture"},
  {feat: "Artistic Hub", pick: ["Quell Unrest"], ability: "Culture"},
  {feat: "Artistic Hub", pick: ["Create A Masterpiece"], ability: "Culture"},

  //********************************************/
  // Level 15: One activity, any ability
  {feat: "Mystic Utopia", pick: ["Creative Solution"]},
].forEach(({feat, pick, leader=true, ability}) => {
  ability ??= Ability.random;

  function setupWithFeat(page, {rigDie, attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne(), ...attrs, feats: [{name: feat}]}, {path: `/?rig-die=${rigDie.join("&rig-die=")}`});
  }

  test(`"${feat}" provides fortune when doing ${pick.join(" > ")}`, async ({ page }) => {
    const dk = await setupWithFeat(page, {rigDie: [1, 19]});

    if (leader) { await dk.pickLeader() }
    await dk.pickActivity(...pick)
    await expect(dk.locator(`[data-value="${ability}"] .modifier-breakdown li`)).toContainText([
      `${feat}🔄`,
    ]);
    await dk.makeDecision(ability);
    await expect(dk.rollBanners).toContainText(`🔄 ${feat}`);
    await expect(dk.locator("dice-roll .description")).toContainText(`2d20kh + 3 vs 14`);
    await expect(dk.locator("dice-roll .summary")).toContainText(`(1 | 19) + 3`);
  });
})
