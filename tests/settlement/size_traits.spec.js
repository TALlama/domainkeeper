const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require('../domainkeeper_page');
const { inTurnOne } = require('../fixtures/domains');


test.describe("Affect on settlement type", () => {
  function makeSettlement({size, structureCount}) {
    return {name: "Bigappel", id: "nyc", traits: [size || "Village"], powerups: Array.from({length: structureCount || 0}, (_, ix) => {return {name: `Generic Block ${ix + 1}`}})};
  }
  let build = async (dk) => {
    await dk.pickActivity("Build Structure", "Shrine", "Reduce Culture by 1 to proceed", "Economy", "Critical Success");
    await dk.setCurrentActor("Bigappel");
  };

  test('becomes a Town when there are 4+ completed structures', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({size: "Village", structureCount: 4})]});
    await dk.setCurrentActor("Bigappel");

    await build(dk);
    await expect(dk.currentActorTraits()).toHaveText("Town");
    await expect(dk.topActivity().log).toContainText("Milestone: First Town");
  });

  test('becomes a City when there are 8+ completed structures', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({size: "Town", structureCount: 8})]});
    await dk.setCurrentActor("Bigappel");

    await build(dk);
    await expect(dk.currentActorTraits()).toHaveText("City");
    await expect(dk.topActivity().log).toContainText("Milestone: First City");
  });

  test('becomes a Metropolis when there are 16+ completed structures', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), settlements: [makeSettlement({size: "City", structureCount: 16})]});
    await dk.setCurrentActor("Bigappel");

    await build(dk);
    await expect(dk.currentActorTraits()).toHaveText("Metropolis");
    await expect(dk.topActivity().log).toContainText("Milestone: First Metropolis");
  });
});
