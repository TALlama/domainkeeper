const { test, expect } = require('@playwright/test');
const { DomainkeeperPage, TraitEditor } = require("../domainkeeper_page");
const { inTurnOne, endTurnOne } = require('../fixtures/domains');

function setSize(dk, size) {
  return dk.editActor("Capital", async editor => {
    const traitEditor = new TraitEditor(dk.page, editor);
    await traitEditor.removeTrait("Village");
    await traitEditor.addTrait(size);
  });
}

test('can rename settlements', async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, inTurnOne);

  await dk.renameActor("Capital", "The Hub");
  await expect(dk.currentActorName).toHaveText("The Hub");
});

test('can update traits', async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, inTurnOne);

  await expect(dk.currentActorTraits()).toHaveText(["Village"]);
  await setSize(dk, "Town");
  await expect(dk.currentActorTraits()).toHaveText(["Town"]);
});

test.describe("Milestones", () => {
  test('first Town', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let xpBefore = await dk.stat("xp");
    await setSize(dk, "Town");
    expect(await dk.stat("xp")).toEqual(xpBefore + 60);
    expect(await dk.nudgeLog()).toContainText("Milestone: First Town");
  });

  test('first City', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let xpBefore = await dk.stat("xp");
    await setSize(dk, "City");
    expect(await dk.stat("xp")).toEqual(xpBefore + 80);
    expect(await dk.nudgeLog()).toContainText("Milestone: First City");
  });

  test('first Metropolis', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let xpBefore = await dk.stat("xp");
    await setSize(dk, "Metropolis");
    expect(await dk.stat("xp")).toEqual(xpBefore + 120);
    expect(await dk.nudgeLog()).toContainText("Milestone: First Metropolis");
  });
});
