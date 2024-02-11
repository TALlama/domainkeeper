const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne } = require('./fixtures/domains');
const { leaders } = require('./fixtures/leaders');
const { Ability } = require('../js/models/abilities');

test.describe("Track changes to the domain's", () => {
  test('ability scores', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let ability = Ability.random;
    await dk.statInput(ability).fill("4");
    await expect(await dk.nudgeLog()).toContainText(`${ability} updated to 4, from 2`);
  });

  test('other stats', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    let stat = "Unrest Size XP Level".split(" ").random();
    let oldValue = await dk.stat(stat);
    await dk.statInput(stat).fill("4");
    await expect(await dk.nudgeLog()).toContainText(`${stat} updated to 4, from ${oldValue}`);
  });
});

test.describe("Track when a structure is", () => {
  test('added', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.settlementsList.getByText("Capital").click();

    await page.getByLabel("Structure:").fill("Herbalist");
    await page.locator(".structure-controls").getByRole("button", {name: "Build"}).click();
    await expect(dk.currentActorPowerups()).toHaveText(["Town Hall", "Herbalist"]);

    await expect(await dk.nudgeLog()).toContainText(`Structure added to Capital: Herbalist`);
  });

  test('destroyed', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);
    await dk.settlementsList.getByText("Capital").click();

    await page.locator('li').filter({hasText: 'Town Hall' }).getByRole("link", {name: "ℹ️"}).click();
    page.once('dialog', async dialog => { await dialog.accept() });
    await page.getByRole("button", {name: "Destroy"}).click();
    await expect(dk.currentActorPowerups()).toHaveText([]);

    await expect(await dk.nudgeLog()).toContainText(`Structure destroyed in Capital: Town Hall`);
  });
});


test.describe("Track when an actor", () => {
  test('is renamed', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne);

    await dk.renameActor("Anne", "Lady Anne");
    await expect(await dk.nudgeLog()).toContainText(`Kneel, Anne. Rise, Lady Anne!`);
  });

  test('has traits are added', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: [leaders.anne]});

    expect(await dk.currentActorTraits()).toHaveText(["PC"]);
    await dk.addActorTraits("Anne", ["Famous"]);
    expect(await dk.currentActorTraits()).toHaveText(["Famous", "PC"]);
    await expect(await dk.nudgeLog()).toContainText(`Anne now has traits: Famous, PC`);
  });

  test('has traits are removed', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne, leaders: [{...leaders.anne, traits: ["PC", "Famous"]}]});

    await dk.removeActorTraits("Anne", ["Famous"]);
    expect(await dk.currentActorTraits()).toHaveText(["PC"]);
    await expect(await dk.nudgeLog()).toContainText(`Anne now has traits: PC`);
  });
});
