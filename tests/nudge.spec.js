const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne } = require('./fixtures/domains');
const { leaders } = require('./fixtures/leaders');
const { Ability } = require('../js/models/abilities');

test.describe("Track changes to the domain's", () => {
  test('ability scores', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());

    let ability = Ability.random;
    await dk.statInput(ability).fill("4");
    await expect(await dk.nudgeLog()).toContainText(`Nudge: Boosted ${ability} by 2, to 4`);

    await dk.statInput(ability).fill("1");
    await expect(await dk.nudgeLog()).toContainText(`Nudge: Reduced ${ability} by 3, to 1`);
  });

  test('xp', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());

    let oldValue = await dk.stat("xp");
    await dk.statInput("XP").fill("1000");
    await expect(await dk.nudgeLog()).toContainText(`Nudge: Boosted XP by ${1000 - oldValue}, to 1000`);
    await dk.statInput("XP").fill("10");
    await expect(await dk.nudgeLog()).toContainText(`Nudge: Reduced XP by 990, to 10`);
  });

  test('other stats', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());

    let stat = "Unrest Size Level".split(" ").random();
    let oldValue = await dk.stat(stat);
    await dk.statInput(stat).fill("4");
    await expect(await dk.nudgeLog()).toContainText(`Nudge: Boosted ${stat} by ${4 - oldValue}, to 4`);
    await dk.statInput(stat).fill("3");
    await expect(await dk.nudgeLog()).toContainText(`Nudge: Reduced ${stat} by 1, to 3`);
  });
});

test.describe("Track when a structure is", () => {
  test('added', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
    await dk.settlementsList.getByText("Capital").click();

    await page.getByLabel("Structure:").fill("Herbalist");
    await page.locator(".structure-controls").getByRole("button", {name: "Build"}).click();
    await expect(dk.currentActorPowerups()).toHaveText(["Town Hall", "Herbalist"]);

    await expect(await dk.nudgeLog()).toContainText(`Structure added to Capital: Herbalist`);
  });

  test('destroyed', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
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
    const dk = await DomainkeeperPage.load(page, inTurnOne());

    await dk.renameActor("Anne", "Lady Anne");
    await expect(await dk.nudgeLog()).toContainText(`Kneel, Anne. Rise, Lady Anne!`);
  });

  test('has traits are added', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), leaders: [leaders.anne]});

    expect(await dk.currentActorTraits()).toHaveText(["PC"]);
    await dk.addActorTraits("Anne", ["Famous"]);
    expect(await dk.currentActorTraits()).toHaveText(["Famous", "PC"]);
    await expect(await dk.nudgeLog()).toContainText(`Anne now has traits: Famous, PC`);
  });

  test('has traits are removed', async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, {...inTurnOne(), leaders: [{...leaders.anne, traits: ["PC", "Famous"]}]});

    await dk.removeActorTraits("Anne", ["Famous"]);
    expect(await dk.currentActorTraits()).toHaveText(["PC"]);
    await expect(await dk.nudgeLog()).toContainText(`Anne now has traits: PC`);
  });
});
