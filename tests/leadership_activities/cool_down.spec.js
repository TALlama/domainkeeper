const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require('../fixtures/domains');
const { Ability } = require('../../js/models/abilities');
const { testMilestone } = require('./milestones_helper');

test.describe("Boosts the ability below the one rolled", () => {
  Ability.all.forEach(ability => {
    let targetAbility = Ability.next(ability);

    test.describe(`when rolling ${ability}, targetting ${targetAbility}`, () => {
      test.describe("Critical Success", () => {
        test("Increases the target ability by 2 at minimum", async ({ page }) => {
          const dk = await DomainkeeperPage.load(page, inTurnOne());
          await dk.pickLeader();

          let before = await dk.stat(targetAbility);
          await dk.pickActivity("Cool Down", ability, "Critical Success");
          await dk.expectStat(targetAbility, before + 2);
        });

        test("Increases the target ability by max/3", async ({ page }) => {
          const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [
            {name: "Capital", id: "settlement-capital", traits: ["Village"], powerups: [
              {bonuses: [{max: targetAbility, value: 4}]},
            ]}]});
          await dk.pickLeader();

          let before = await dk.stat(targetAbility);
          await dk.pickActivity("Cool Down", ability, "Critical Success");
          await dk.expectStat(targetAbility, before + 3);
        });
      });

      test.describe("Success", () => {
        test("Increases the target ability by 1 at minimum", async ({ page }) => {
          const dk = await DomainkeeperPage.load(page, inTurnOne());
          await dk.pickLeader();

          let before = await dk.stat(targetAbility);
          await dk.pickActivity("Cool Down", ability, "Success");
          await dk.expectStat(targetAbility, before + 1);
        });

        test("Increases the target ability by max/4", async ({ page }) => {
          const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [
            {name: "Capital", id: "settlement-capital", traits: ["Village"], powerups: [
              {bonuses: [{max: targetAbility, value: 3}]},
            ]}]});
          await dk.pickLeader();

          let before = await dk.stat(targetAbility);
          await dk.pickActivity("Cool Down", ability, "Success");
          await dk.expectStat(targetAbility, before + 2);
        });
      });

      test("Failure leaves all abilities as they were", async ({ page }) => {
        const dk = await DomainkeeperPage.load(page, inTurnOne());
        await dk.pickLeader();
      
        let before = await dk.abilitiesTotal();
        await dk.pickActivity("Cool Down", ability, "Failure");
        await dk.shouldHaveStatTotal(before);
      });

      test("Critical Failure causes unrest", async ({ page }) => {
        const dk = await DomainkeeperPage.load(page, inTurnOne());
        await dk.pickLeader();
      
        let before = await dk.stat('Unrest');
        await dk.pickActivity("Cool Down", ability, "Critical Failure");
        await dk.expectStat("Unrest", before + 1);
      });
    });
  });
});

testMilestone("Cool Down", {
  decisions: ["--ability--", "--outcome--"]
});
