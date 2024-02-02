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
  await monitor({ // now there's an Economy roll; fame can reroll it
    shouldChange: () => dk.rollText(dk.lastRoll),
    shouldNotChange: () => dk.rolls.length,
    when: () => dk.consumables.withName("Mint").click(),
  });
  await expect(dk.consumables.names).toContainText(["Fame"]);
});
