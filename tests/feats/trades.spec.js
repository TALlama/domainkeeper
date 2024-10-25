const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

const testTrade = (feat, {reduce, boost}) => {
  test.describe(feat, () => {
    function setupWithFeat(page, attrs = {}) {
      return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [feat]});
    }

    test(`converts ${reduce} to ${boost}`, async ({ page }) => {
      const starting = 2;
      const dk = await setupWithFeat(page, {[reduce.toLowerCase()]: starting, [boost.toLowerCase()]: starting});
      await expect(dk.consumables.names).toHaveText(["Fame", feat]);

      await dk.consumables.withName(feat).click();
      await dk.expectStat(reduce, starting - 1);
      await dk.expectStat(boost, starting + 1);
      await expect(dk.consumables.names).toHaveText(["Fame"]);
    });

    test('does not work if culture is 1', async ({ page }) => {
      const starting = 1;
      const dk = await setupWithFeat(page, {[reduce.toLowerCase()]: starting, [boost.toLowerCase()]: starting});
      await expect(dk.consumables.names).toHaveText(["Fame", feat]);

      await dk.consumables.withName(feat).click();
      await dk.expectStat(reduce, starting);
      await dk.expectStat(boost, starting);
      await expect(dk.consumables.names).toHaveText(["Fame", feat]);
    });
  });
};

// Burn Culture
testTrade("Folk Stories", {reduce: "Culture", boost: "Loyalty"}); // trained in loyalty
testTrade("Conjure Commodities", {reduce: "Culture", boost: "Economy"}); // expert in culture

// Burn Economy
testTrade("Art Festivals", {reduce: "Economy", boost: "Culture"}); // trained in culture
testTrade("Subsidize Agriculture", {reduce: "Economy", boost: "Stability"}); //expert in stability

// Burn Stability
testTrade("Supply Chain", {reduce: "Stability", boost: "Economy"}); // expert in economy
testTrade("Appeal to Tradition", {reduce: "Stability", boost: "Loyalty"}); // trained in loyalty

// Burn Loyalty
testTrade("National Service", {reduce: "Loyalty", boost: "Stability"}); // expert in stability
testTrade("Patronage System", {reduce: "Loyalty", boost: "Culture"}); // trained in loyalty

// Burn Unrest
testTrade("County Fairs", {reduce: "Unrest", boost: "Economy"}); // level 5; expert in economy

test.describe("Covert Collusion", () => { // level 2; trained in loyalty
  let feat = "Covert Collusion";
  let increase1 = "Unrest";
  let increase2 = "Economy";

  function setupWithFeat(page, attrs = {}) {
    return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [feat]});
  }

  test(`increases both Unrest and Economy`, async ({ page }) => {
    const startingUnrest = [0, 2, 10].random(); // works at any level of unrest

    const dk = await setupWithFeat(page, {unrest: startingUnrest});
    await expect(dk.consumables.names).toHaveText(["Fame", feat]);

    const startingEconomy = await dk.stat("Economy");
    console.log("Starting at", {startingUnrest, startingEconomy});

    await dk.consumables.withName(feat).click();
    await dk.expectStat(increase1, startingUnrest + 1);
    await dk.expectStat(increase2, startingEconomy + 1);
    await expect(dk.consumables.names).toHaveText(["Fame"]);
  });
});
