const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require('../fixtures/domains');
const { Ability } = require('../../js/models/abilities');

export function testMilestone(activity, {domain, decisions, criticalSuccess, success, failure, criticalFailure, xp, ...opts}) {
  domain ??= inTurnOne;
  decisions ??= [];
  success ??= decisions;
  failure ??= decisions;
  xp ??= 20;

  test.describe(`Milestone on first use of ${activity}`, () => {
    let testSuccess = (withDecisions) => (async ({ page }) => {
      const decisions = withDecisions
        .map(d => d === "--ability--" ? Ability.all.random() : d)
        .map(d => d === "--outcome--" ? ["Critical Success", "Success"].random() : d);

      const dk = await DomainkeeperPage.load(page, domain());
      await dk.pickLeader();
    
      const xpBefore = await dk.stat("xp");
      opts.pickSuccess ? await opts.pickSuccess(dk) : await dk.pickActivity(activity, ...decisions);
      await dk.expectStat("xp", xpBefore + xp, `XP After = ${xpBefore} + ${xp}`);
      expect(dk.topActivity().log).toContainText(`Milestone: First successful ${activity}`);
    });

    let testFailure = (withDecisions) => (async ({ page }) => {
      const decisions = withDecisions
        .map(d => d === "--ability--" ? Ability.all.random() : d)
        .map(d => d === "--outcome--" ? ["Critical Failure", "Failure"].random() : d);

      const dk = await DomainkeeperPage.load(page, domain());
      await dk.pickLeader();
    
      const xpBefore = await dk.stat("xp");
      opts.pickFailure ? await opts.pickFailure(dk) : await dk.pickActivity(activity, ...decisions);
      await dk.expectStat("xp", xpBefore);
    })

    test(`when successful`, testSuccess(success));
    if (criticalSuccess) { test(`when critically successful`, testSuccess(criticalSuccess)) }

    test(`not awarded if failed`, testFailure(failure));
    if (criticalFailure) { test(`not awarded if critically failed`, testFailure(criticalFailure)) }
  });
};
