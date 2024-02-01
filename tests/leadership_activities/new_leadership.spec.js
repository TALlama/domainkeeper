const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require('../fixtures/domains');
const { monitor } = require('../helpers');

let leaders = {
  pc: {name: "Polly", id: "leader-polly", traits: ["PC"], initiative: 20},
  npc: {name: "Ned", id: "leader-ned", traits: ["NPC"], initiative: 10},
};

test.describe("Can remove leaders", () => {
  let outcomes = ["Critical Success", "Success", "Failure"];
  
  test(`with the following outcomes: ${outcomes.join("; ")}`, async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc]});
  
    await dk.pickActivity("New Leadership", "Loyalty", outcomes.random(), "Ned", "Don't Add");
    return expect(dk.leaderNames).toHaveText(["Polly"]);
  });
});

test.describe("Can add new PC leaders", () => {
  let outcomes = ["Critical Success", "Success", "Failure"];
  
  test(`with the following outcomes: ${outcomes.join("; ")}`, async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc]});

    page.once('dialog', async dialog => { await dialog.accept("Bertie") });
    await dk.pickActivity("New Leadership", "Loyalty", outcomes.random(), "Don't Remove", "Add a New PC");
    await expect(dk.leaderNames).toHaveText(["Polly", "Ned", "Bertie"]); // they enter with initiative 0

    await dk.setCurrentActor("Bertie");
    await expect(dk.currentActorTraits()).toHaveText("PC");
  });
});

test.describe("Can reinstate AWOL or Retired leaders", () => {
  let outcomes = ["Critical Success", "Success", "Failure"];
  
  test(`with the following outcomes: ${outcomes.join("; ")}`, async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc, {name: "Oldie", id: "leader-oldie", traits: ["NPC", ["Retired", "AWOL"].random()]}]});

    await dk.pickActivity("New Leadership", "Loyalty", outcomes.random(), "Don't Remove", "Oldie");
    await expect(dk.leaderNames).toHaveText(["Polly", "Ned", "Oldie"]);

    await dk.setCurrentActor("Oldie");
    await expect(dk.currentActorTraits()).toHaveText("NPC");
  });
});

test.describe("Can add new NPC leaders", () => {
  let outcomes = ["Critical Success", "Success", "Failure"];
  
  test(`with the following outcomes: ${outcomes.join("; ")}`, async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc]});

    page.once('dialog', async dialog => { await dialog.accept("Bertie") });
    await dk.pickActivity("New Leadership", "Loyalty", outcomes.random(), "Don't Remove", "Add a New NPC");
    await expect(dk.leaderNames).toHaveText(["Polly", "Ned", "Bertie"]); // they enter with initiative 0

    await dk.setCurrentActor("Bertie");
    await expect(dk.currentActorTraits()).toHaveText("NPC");
  });
});

test.describe("Unrest", () => {
  test('Success adds 1 unrest', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc]});

    let before = await dk.stat("Unrest");
    await dk.pickActivity("New Leadership", "Loyalty", "Success", "Ned");
    expect(await dk.stat("Unrest")).toEqual(before + 1);
  });

  test('Failure adds 2-5 unrest', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc]});

    let before = await dk.stat("Unrest");
    await dk.pickActivity("New Leadership", "Loyalty", "Failure", "Ned");
    expect([before + 2, before + 3, before + 4, before + 5]).toContain(await dk.stat("Unrest"));
  });

  test('Critical Failure adds 2-8 unrest', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    await dk.loadDomain({...inTurnOne, leaders: [leaders.pc, leaders.npc]});

    let before = await dk.stat("Unrest");
    await dk.pickActivity("New Leadership", "Loyalty", "Critical Failure", "Ned");
    expect([before + 2, before + 3, before + 4, before + 5, before + 6, , before + 7, before + 8]).toContain(await dk.stat("Unrest"));
  });
});

test.describe("Loading", () => {
  test('Adds an activity to the selected settlement', async ({ page }) => {
    let dk = new DomainkeeperPage(page);
    await page.goto('/');
    let classic = {name: "Classic", id: "leader-classic", traits: ["NPC", "Retired"]};
    let hotrod = {name: "Hotrod", id: "leader-hotrod", traits: ["NPC"]};
    let saved = {...inTurnOne, leaders: [leaders.pc, leaders.npc, classic, hotrod]};
    saved.turns[1].activities.push({
      "name": "New Leadership",
      "actorId": leaders.pc.id,
      "ability": "Loyalty",
      "outcome": "success",
      "removedId": classic.id,
      "addedType": "NPC",
      "addedId": hotrod.id,
    });
    await dk.loadDomain(saved);
    
    let takeCharge = dk.activity("New Leadership");
    await expect(takeCharge.root).toHaveAttribute("resolved");
    await expect(takeCharge.decisionPanel("Roll").root).toContainText("Roll Loyalty");
    await expect(takeCharge.decisionPanel("Outcome").root).toContainText("Outcome Success");
    await expect(takeCharge.decisionPanel("Remove a Leader").root).toContainText("Remove a Leader Classic");
    await expect(takeCharge.decisionPanel("Add a Leader").root).toContainText("Add a Leader Hotrod");
  });
});

