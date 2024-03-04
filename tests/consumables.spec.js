const { test, expect } = require('@playwright/test');
const { DomainkeeperPage } = require("./domainkeeper_page");
const { onTurnOne } = require('./fixtures/domains');
const { monitor } = require('./helpers');

let abilities = "Culture Economy Loyalty Stability".split(" ");

test('fame rerolls the last roll', async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, onTurnOne);

  await monitor({ // no roll; fame won't get used
    shouldNotChange: () => dk.consumables.names,
    when: () => dk.consumables.withName("Fame").click(),
  });

  dk.rollAbility(abilities[2]);
  await monitor({ // now there's a roll; fame can reroll it
    shouldChange: () => dk.rollText(dk.lastRoll),
    shouldNotChange: () => expect(dk.rolls).toHaveCount(1),
    when: () => dk.consumables.withName("Fame").click(),
  });
  await expect(dk.consumables.names).toContainText([]);
});

test('mint rerolls only economy rolls', async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, {...onTurnOne, settlements: [{name: "Denver", powerups: [{name: "Mint"}]}]});

  // no economy roll; fame won't get used
  await dk.rollAbility("Culture");
  await monitor({ // no roll; fame won't get used
    shouldNotChange: () => dk.consumables.names,
    when: () => dk.consumables.withName("Mint").click(),
  });

  // if there is a roll, we'll reroll it
  await dk.rollAbility("Economy");
  await monitor({ // now there's an Economy roll; Mint can reroll it
    shouldChange: () => dk.rollText(dk.lastRoll),
    shouldNotChange: () => dk.rolls.length,
    when: () => dk.consumables.withName("Mint").click(),
  });
  await expect(dk.consumables.names).toContainText(["Fame"]);
});

test('Pathfinder Society Outpost rerolls only "Clear/Claim Hex" rolls', async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, {...onTurnOne, settlements: [{name: "Denver", powerups: [{name: "Pathfinder Society Outpost"}]}]});
  await dk.pickLeader();

  // ineligble roll; fame won't get used
  await dk.rollAbility("Economy");
  await monitor({ // no roll; fame won't get used
    shouldNotChange: () => dk.consumables.names,
    when: () => dk.consumables.withName("Pathfinder Society Outpost").click(),
  });

  // if there is an eligible roll, we'll reroll it
  await dk.pickActivity(["Claim Hex", "Clear Hex"].random(), [74, 51], ["Stability", "Economy"].random(), "Failure");
  await monitor({ // now there's an eligible roll; PSO can reroll it
    shouldChange: () => dk.rollText(dk.lastRoll),
    shouldNotChange: () => dk.rolls.length,
    when: () => dk.consumables.withName("Pathfinder Society Outpost").click(),
  });
  await expect(dk.consumables.names).toContainText(["Fame"]);
});

test("Can affect rolls by giving circumstance bonuses", async ({ page }) => {
  const dk = await DomainkeeperPage.load(page, onTurnOne);
  await dk.pickLeader();

  await dk.pickActivity("Claim Hex", [50, 50], "Economy", "Critical Failure");
  await dk.rollAbility("Stability");
  await expect(dk.rollBanners.first()).toContainText("-1 Disaster");
});
