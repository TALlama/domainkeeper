const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require('../fixtures/domains');
const { Ability } = require('../../js/models/abilities');

export function testMilestone(activity, {domain, decisions, success, failure, xp, ...opts}) {
  domain ??= inTurnOne;
  decisions ??= [];
  success ??= decisions;
  failure ??= decisions;
  xp ??= 20;

  test.describe(`Milestone on first use of ${activity}`, () => {
    test(`when successful`, async ({ page }) => {
      const decisions = success
        .map(d => d === "--ability--" ? Ability.all.random() : d)
        .map(d => d === "--outcome--" ? ["Critical Success", "Success"].random() : d);

      const dk = await DomainkeeperPage.load(page, domain);
      await dk.pickLeader();
    
      const xpBefore = await dk.stat("xp");
      opts.pickSuccess ? await opts.pickSuccess(dk) : await dk.pickActivity(activity, ...decisions);
      expect(await dk.stat("xp"), `XP After = ${xpBefore} + ${xp}`).toEqual(xpBefore + xp);
      expect(dk.topActivity().log).toContainText(`Milestone: First successful ${activity}`);
    });

    test(`not awarded if failed`, async ({ page }) => {
      const decisions = (failure || success)
        .map(d => d === "--ability--" ? Ability.all.random() : d)
        .map(d => d === "--outcome--" ? ["Critical Failure", "Failure"].random() : d);

      const dk = await DomainkeeperPage.load(page, domain);
      await dk.pickLeader();
    
      const xpBefore = await dk.stat("xp");
      opts.pickFailure ? await opts.pickFailure(dk) : await dk.pickActivity(activity, ...decisions);
      expect(await dk.stat("xp")).toEqual(xpBefore);
    });
  });
};
