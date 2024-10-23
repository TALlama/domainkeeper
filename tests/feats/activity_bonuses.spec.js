const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');
const { Ability } = require('../../js/models/abilities');

[
  //********************************************/
  // Level 1: +1 to two activity/ability pairs
  {feat: "Crush Dissent", pick: ["Quell Unrest"], ability: "Loyalty", bonus: 1},
  {feat: "Crush Dissent", pick: ["Take Charge"], ability: "Loyalty", bonus: 1},

  {feat: "Beasts of Burden", pick: ["Build Up"], ability: "Stability", bonus: 1},
  {feat: "Beasts of Burden", pick: ["Build Infrastructure"], ability: "Stability", bonus: 1},

  {feat: "Medicinal Crops", pick: ["Quell Unrest"], ability: "Stability", bonus: 1},
  {feat: "Medicinal Crops", pick: ["Cool Down"], ability: "Stability", bonus: 1},

  {feat: "Dedicated Builders", pick: ["Build Infrastructure"], ability: "Stability", bonus: 1},
  {feat: "Dedicated Builders", leader: false, pick: ["Build Structure"], ability: "Economy", bonus: 1},

  {feat: "National Specialty", pick: ["Create A Masterpiece"], ability: "Culture", bonus: 1},
  {feat: "National Specialty", pick: ["Cool Down"], ability: "Culture", bonus: 1},

  //********************************************/
  // Level 1: +2 to one activity/ability pair
  {level: 1, feat: "Canal Aptitude", pick: ["Build Infrastructure", [50, 50], "Irrigation"], bonus: 2},
  {level: 1, feat: "Adventurous Values", pick: ["Hire Adventurers"], ability: "Economy", bonus: 2},
  {level: 1, feat: "Militant Peace-Keeping", pick: ["Build Up"], ability: "Loyalty", bonus: 1},

  //********************************************/
  // Level 1: once-per-turn +1 to one ability
  {level: 1, feat: "Frugal", ability: "Stability", bonus: 2},
  {level: 1, feat: "Friends of the Wild", ability: "Economy", bonus: 2},
  {level: 1, feat: "Impressive Accoutrements", ability: "Loyalty", bonus: 2},
  {level: 1, feat: "Traveling Troubadours", ability: "Culture", bonus: 2},

  //********************************************/
  // Level 7: +2 to two activity/ability pairs
  {level: 7, feat: "Monstrous Husbandry", pick: ["Build Up"], ability: "Stability", bonus: 2},
  {level: 7, feat: "Monstrous Husbandry", pick: ["Build Infrastructure"], ability: "Stability", bonus: 2}
].forEach(({feat, pick, leader=true, ability, bonus}) => {
  pick ??= ["Creative Solution"];
  ability ??= Ability.random;

  function setupWithFeat(page, {attrs={}}={}) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: feat}]});
  }

  test(`"${feat}" gives a +${bonus} bonus to ${pick.join(" > ")}`, async ({ page }) => {
    const dk = await setupWithFeat(page);

    if (leader) { await dk.pickLeader() }
    await dk.pickActivity(...pick)
    await expect(dk.locator(`[data-value="${ability}"] .modifier-breakdown li`)).toContainText([
      `${feat}+${bonus}`,
    ]);
  });
})
