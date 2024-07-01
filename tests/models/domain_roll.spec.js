const { test, expect } = require('@playwright/test');
const { Domain } = require('../../js/models/domain');
const { DomainRoll } = require('../../js/models/domain_roll');

test("associations", () => {
  let domain = new Domain({});
  let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
  expect(roll.domain).toEqual(domain);
  expect(roll.ability).toEqual("Loyalty");
  expect(roll.activity).toEqual("Claim Hex");
  expect(roll.availableBonuses).toEqual([]);
});

test.describe("Bonuses", () => {
  function makeDomain(bonuses) { return new Domain({settlements: [{powerups: [{name: "Powerup", bonuses}]}]}) }
  function makeABC(type, values = []) { return makeDomain([
    {name: "A", type, value: values[0] ?? 1},
    {name: "B", type: "other", value: values[1] ?? 2},
    {name: "C", type, value: values[2] ?? 3},
  ]) }

  test("all point back to their sources", () => {
    let domain = makeABC("item");
    let powerup = domain.settlements[0].powerups[0];
    let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
    expect(roll.availableBonuses.map(b => b.source)).toEqual([powerup, powerup, powerup]);
  });

  test.describe("items", () => {
    test("availableItemBonuses", () => {
      let domain = makeABC("item");
      let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
      expect(roll.availableItemBonuses.map(b => b.name)).toEqual(["A", "C"]);
    });

    test.describe("itemBonuses", () => {
      test("boost only", () => {
        let domain = makeABC("item");
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.itemBonuses.map(b => b.name)).toEqual(["C"]);
        expect(roll.itemBonus).toEqual(+3);
      });

      test("boost and penalty", () => {
        let domain = makeABC("item", [-1, 2, 3]);
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.itemBonuses.map(b => b.name)).toEqual(["C", "A"]);
        expect(roll.itemBonus).toEqual(+2);
      });

      test("boost and boost", () => {
        let domain = makeABC("item", [1, 2, 3]);
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.itemBonuses.map(b => b.name)).toEqual(["C"]);
        expect(roll.itemBonus).toEqual(+3);
        expect(roll.unusedItemBonuses.map(b => b.name)).toEqual(["A"]);
      });
    });
  });

  test.describe("statuses", () => {
    test("availableStatusBonuses", () => {
      let domain = makeABC("status");
      let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
      expect(roll.availableStatusBonuses.map(b => b.name)).toEqual(["A", "C"]);
    });

    test.describe("statusBonuses", () => {
      test("boost only", () => {
        let domain = makeABC("status");
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.statusBonuses.map(b => b.name)).toEqual(["C"]);
        expect(roll.statusBonus).toEqual(+3);
      });

      test("boost and penalty", () => {
        let domain = makeABC("status", [-1, 2, 3]);
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.statusBonuses.map(b => b.name)).toEqual(["C", "A"]);
        expect(roll.statusBonus).toEqual(+2);
      });

      test("boost and boost", () => {
        let domain = makeABC("status", [1, 2, 3]);
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.statusBonuses.map(b => b.name)).toEqual(["C"]);
        expect(roll.statusBonus).toEqual(+3);
        expect(roll.unusedStatusBonuses.map(b => b.name)).toEqual(["A"]);
      });
    });
  });

  test.describe("circumstances", () => {
    test("availableCircumstanceBonuses", () => {
      let domain = makeABC("circumstance");
      let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
      expect(roll.availableCircumstanceBonuses.map(b => b.name)).toEqual(["A", "C"]);
    });

    test.describe("circumstanceBonuses", () => {
      test("boost only", () => {
        let domain = makeABC("circumstance");
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.circumstanceBonuses.map(b => b.name)).toEqual(["C"]);
        expect(roll.circumstanceBonus).toEqual(+3);
      });

      test("boost and penalty", () => {
        let domain = makeABC("circumstance", [-1, 2, 3]);
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.circumstanceBonuses.map(b => b.name)).toEqual(["C", "A"]);
        expect(roll.circumstanceBonus).toEqual(+2);
      });

      test("boost and boost", () => {
        let domain = makeABC("circumstance", [1, 2, 3]);
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.circumstanceBonuses.map(b => b.name)).toEqual(["C"]);
        expect(roll.circumstanceBonus).toEqual(+3);
        expect(roll.unusedCircumstanceBonuses.map(b => b.name)).toEqual(["A"]);
      });
    });
  });

  test.describe("untyped penalties always count", () => {
    test("availableUntypedBonuses", () => {
      let domain = makeABC("untyped");
      let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
      expect(roll.availableUntypedBonuses.map(b => b.name)).toEqual(["A", "C"]);
    });

    test.describe("untypedBonuses", () => {
      test("penalties only", () => {
        let domain = makeABC("untyped", [-1, -2, -3]);
        let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
        expect(roll.untypedBonuses.map(b => b.name)).toEqual(["C", "A"]);
        expect(roll.untypedBonus).toEqual(-4);
        expect(roll.unusedUntypedBonuses.map(b => b.name)).toEqual([]);
      });
    });
  });

  test.describe("all", () => {
    test("boosts and penalties", () => {
      let domain = makeDomain([
        {name: "I+", type: "item", value: +1},
        {name: "I-", type: "item", value: -1},
        {name: "S+", type: "status", value: +2},
        {name: "S-", type: "status", value: -2},
        {name: "C+", type: "circumstance", value: +3},
        {name: "C-", type: "circumstance", value: -3},
        {name: "U1", type: "untyped", value: -1},
        {name: "U2", type: "untyped", value: -1},
      ]);
      let roll = new DomainRoll({domain, ability: "Loyalty", activity: "Claim Hex"});
      expect(roll.bonuses.map(b => b.name)).toEqual(["Loyalty", "Level", "I+", "I-", "S+", "S-", "C+", "C-", "U2", "U1"]);
      expect(roll.bonus).toEqual(+2 +1 +1 -1 +2 -2 +3 -3 -1 -1); // +1
    });
  });

  test.describe("with option", () => {
    let ability = "Grace";
    let activity = "Dance";
    let option = "Tango";

    test("when the bonus has no option", () => {
      let domain = makeDomain([{name: "Dance your heart out", type: "circumstance", value: 1, ability, activity}]);
      let roll = new DomainRoll({domain, ability, activity, option});
      expect(roll.availableBonuses.map(b => b.name)).toEqual(["Dance your heart out"]);
    });
    
    test("when the bonus has an option that matches the roll", () => {
      let domain = makeDomain([{name: "Dance the Tango", type: "circumstance", value: 1, ability, activity, option}]);
      let roll = new DomainRoll({domain, ability, activity, option});
      expect(roll.availableBonuses.map(b => b.name)).toEqual(["Dance the Tango"]);
    });

    test("when the bonus has an option that differs from the roll", () => {
      let domain = makeDomain([{name: "Dance the Tango", type: "circumstance", value: 1, ability, activity, option}]);
      let roll = new DomainRoll({domain, ability, activity, option: "Waltz"});
      expect(roll.availableBonuses.map(b => b.name)).toEqual([]);
    });

    test("when the bonus has an option but the roll does not", () => {
      let domain = makeDomain([{name: "Dance the Tango", type: "circumstance", value: 1, ability, activity, option}]);
      let roll = new DomainRoll({domain, ability, activity});
      expect(roll.availableBonuses.map(b => b.name)).toEqual([]);
    });
  })
});

