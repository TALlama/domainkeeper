const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { inTurnOne } = require('./fixtures/domains');
const { Ability } = require('../js/models/abilities');

async function nudgeLog(dk) {
  await expect(dk.topActivity().name).toHaveText("Nudge");
  return dk.topActivity().log;
}

test.describe("Track changes to the domain's", () => {
  test('ability scores', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);

    let ability = Ability.random;
    await dk.statInput(ability).fill("4");
    await expect(await nudgeLog(dk)).toContainText(`${ability} updated to 4, from 2`);
  });

  test('other stats', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);

    let stat = "Unrest Size XP Level".split(" ").random();
    let oldValue = await dk.stat(stat);
    await dk.statInput(stat).fill("4");
    await expect(await nudgeLog(dk)).toContainText(`${stat} updated to 4, from ${oldValue}`);
  });
});

test.describe("Track when a structure is", () => {
  test('added', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);
    await dk.settlementsList.getByText("Capital").click();

    await page.getByLabel("Structure:").fill("Herbalist");
    await page.locator(".structure-controls").getByRole("button", {name: "Build"}).click();
    await expect(dk.currentActorPowerups()).toHaveText(["Town Hall", "Herbalist"]);

    await expect(await nudgeLog(dk)).toContainText(`Structure added to Capital: Herbalist`);
  });

  test('destroyed', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain(inTurnOne);
    await dk.settlementsList.getByText("Capital").click();

    await page.locator('li').filter({hasText: 'Town Hall' }).getByRole("link", {name: "ℹ️"}).click();
    page.once('dialog', async dialog => { await dialog.accept() });
    await page.getByRole("button", {name: "Destroy"}).click();
    await expect(dk.currentActorPowerups()).toHaveText([]);

    await expect(await nudgeLog(dk)).toContainText(`Structure destroyed in Capital: Town Hall`);
  });
});
