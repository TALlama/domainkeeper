const { test, expect } = require('@playwright/test');
const { DomainkeeperPage, TraitEditor } = require("../domainkeeper_page");
const { inTurnOne, endTurnOne } = require('../fixtures/domains');

test('can rename settlements', async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, inTurnOne);

  await dk.renameActor("Capital", "The Hub");
  await expect(dk.currentActorName).toHaveText("The Hub");
});

test('can update traits', async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, inTurnOne);

  await expect(dk.currentActorTraits()).toHaveText(["Village"]);
  await dk.editActor("Capital", async editor => {
    const traitEditor = new TraitEditor(page, editor);
    await traitEditor.removeTrait("Village");
    await traitEditor.addTrait("Town");
  });
  await expect(dk.currentActorTraits()).toHaveText(["Town"]);
});
