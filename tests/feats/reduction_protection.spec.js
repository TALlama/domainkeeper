const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { onTurnOne } = require('../fixtures/domains');

[
  // level 2: one-time DC11
  {
    feat: "Free and Fair",
    protects: "Loyalty",
    threshold: 11,
  },
  {
    feat: "Proclaim to the Faithful",
    protects: "Culture",
    threshold: 11,
  },
  {
    feat: "United Front",
    protects: "Loyalty",
    threshold: 11,
  },
  // level 7: any-time DC15
  {
    feat: "Quality of Life",
    protects: "Culture",
    threshold: 15,
  },
  {
    feat: "Industrious Efficiency",
    protects: "Economy",
    threshold: 15,
  },
  // Trusted Journalists: any-time DC18
  {
    feat: "Trusted Journalists",
    protects: "Loyalty",
    threshold: 18,
  },
  {
    feat: "Trusted Journalists",
    protects: "Stability",
    threshold: 18,
  },
].forEach(({feat, protects, threshold, pick, leader=true}) => {
  pick ??= ["Hire Adventurers", `Reduce ${protects} by 1 to proceed`];

  test.describe(`"${feat}" protects against reductions in ${protects}`, () => {
    function setupWithFeat(page, {rigDie, attrs={}}={}) {
      return DomainkeeperPage.load(page, {...onTurnOne, ...attrs, feats: [{name: feat}]}, {path: `/?rig-die=${rigDie}`});
    }

    test(`if the die rolls ${threshold} or more`, async ({ page }) => {
      const dk = await setupWithFeat(page, {rigDie: [threshold, 20].random()});

      if (leader) { await dk.pickLeader() }
      await dk.pickActivity(...pick)
      await expect(dk.activity(pick[0]).log).toContainText(
        `"${feat}" protects against reduction to ${protects}`
      );
    });

    test(`if the die rolls ${threshold-1} or less`, async ({ page }) => {
      const dk = await setupWithFeat(page, {rigDie: [1, threshold-1].random()});

      if (leader) { await dk.pickLeader() }
      await dk.pickActivity(...pick)
      await expect(dk.activity("Hire Adventurers").log).toContainText(
        `Reduced ${protects} by 1`
      );
    });
  });
})
