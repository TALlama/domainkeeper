const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("../domainkeeper_page");
const { inTurnOne } = require('../fixtures/domains');
const { Ability } = require('../../js/models/abilities');
const { testMilestone } = require('./milestones_helper');

async function establishSettlement(dk, {ability, outcome, existingSettlements, settlementName, payment}) {
  settlementName = settlementName ?? "Lowercase";
  outcome = outcome ?? "Critical Success"
  let amount = {"Critical Success": 0, "Success": 1, "Failure": 2}[outcome];

  await dk.pickActivity("Establish Settlement");
  await dk.makeLocationDecision([50, 50]);
  dk.page.once('dialog', async dialog => { await dialog.accept(settlementName) });
  await dk.makeDecisions([ability || Ability.random, outcome]);
  if (amount) { await dk.makeDecision(payment || `Reduce ${Ability.random} by ${amount} to proceed`) }
  return expect(dk.settlementNames).toHaveText([
    ...(existingSettlements || ["Capital"]),
    ...(outcome === "Critical Failure" ? [] : [settlementName]),
  ]);
};

test.describe("Can establish a settlement", () => {
  let outcomes = ["Critical Success", "Success", "Failure"];
  
  test(`with the following outcomes: ${outcomes.join("; ")}`, async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
    await dk.pickLeader();
  
    const xpBefore = await dk.stat("xp");
    const outcome = outcomes.random();
    await establishSettlement(dk, {outcome, settlementName: "Lowercase"});
    await expect(dk.settlementNames).toHaveText(["Capital", "Lowercase"]);
    await dk.expectStat("xp", xpBefore + 40 + (outcome == "Failure" ? 0 : 20)); // 40 for second settlement 20 for first success
  });
});

test.describe("Cost", () => {
  test(`Critical Success is free`, async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
    await dk.pickLeader();

    let before = await dk.abilitiesTotal();
    await establishSettlement(dk, {outcome: "Critical Success", paymnet: "Not needed"});
    await dk.shouldHaveStatTotal(before);
  });

  test(`Success costs 1`, async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
    await dk.pickLeader();

    let before = await dk.abilitiesTotal();
    await establishSettlement(dk, {outcome: "Success"});
    await dk.shouldHaveStatTotal(before - 1);
  });

  test(`Failure costs 2`, async ({ page }) => {
    const dk = await DomainkeeperPage.load(page, inTurnOne());
    await dk.pickLeader();

    let before = await dk.abilitiesTotal();
    await establishSettlement(dk, {outcome: "Failure"});
    await dk.shouldHaveStatTotal(before - 2);
  });
});

test.describe("Loading", () => {
  test('Connects to the settlement', async ({ page }) => {
    let saved = {...inTurnOne()};
    saved.turns[1].activities.push({
      "name": "Establish Settlement",
      "actorId": inTurnOne().leaders[0].id,
      "location": "ok",
      "position": [80, 25],
      "ability": "Loyalty",
      "outcome": "success",
      "payment": "Economy",
    });
    const dk = await DomainkeeperPage.load(page, saved);
    
    let takeCharge = dk.activity("Establish Settlement");
    await expect(takeCharge.root).toHaveAttribute("resolved");
    await expect(takeCharge.decisionPanel("Location").root).toHaveAttribute("resolved");
    await expect(takeCharge.decisionPanel("Roll").root).toContainText("Roll Loyalty");
    await expect(takeCharge.decisionPanel("Outcome").root).toContainText("Outcome Success");
    await expect(takeCharge.decisionPanel("Payment").root).toContainText("Payment Reduce Economy by 1 to proceed");
  });
});

testMilestone("Establish Settlement", {
  domain: () => ({...inTurnOne(), settlements: [{name: "One", position: [50, 50]}, {name: "Two"}]}),
  pickSuccess: async (dk) => await establishSettlement(dk, {outcome: ["Critical Success", "Success"].random(), existingSettlements: ["One", "Two"]}),
  pickFailure: async (dk) => await establishSettlement(dk, {outcome: ["Critical Failure"].random(), existingSettlements: ["One", "Two"]}),
});
