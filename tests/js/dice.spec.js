const { test, expect } = require('@playwright/test');
const { Flat, Die, DieSet, DicePool } = require('../../js/dice');

test.describe("Flat", () => {
  test.describe("construction", () => {
    test("positive", () => {
      let unrolled = new Flat(2);
      expect(unrolled.sides).toEqual([2]);
      expect(unrolled.value).toEqual(2);
    });

    test("negative", () => {
      let unrolled = new Flat(-2);
      expect(unrolled.sides).toEqual([-2]);
      expect(unrolled.value).toEqual(-2);
    });
  });

  test.describe("stringifying", () => {
    test.describe("description", () => {
      test("positive", () => expect(new Flat(2).description).toEqual("2"));
      test("negative", () => expect(new Flat(-2).description).toEqual("2"));
    });

    test.describe("summary", () => {
      test("positive", () => expect(new Flat(2).summary).toEqual("2"));
      test("negative", () => expect(new Flat(-2).summary).toEqual("2"));
    });
  });
});

test.describe("Die", () => {
  test.describe("construction", () => {
    test("simple", () => {
      let unrolled = new Die(4);
      expect(unrolled.size).toEqual(4);
      expect(unrolled.sides).toEqual([1, 2, 3, 4]);
      expect(unrolled.sides).toContain(unrolled.value);
    });

    test("with value", () => {
      let rolled = new Die(4, {value: 2});
      expect(rolled.size).toEqual(4);
      expect(rolled.value).toEqual(2);
    });

    test("with target", () => {
      let rolled = new Die(20, {value: 12, target: 10});
      expect(rolled.size).toEqual(20);
      expect(rolled.value).toEqual(12);
      expect(rolled.target).toEqual(10);
    });
  });

  test.describe("standard dice", () => {
    test("d4", () => {
      let d4 = Die.d4();
      expect(d4).toBeGreaterThanOrEqual(1);
      expect(d4).toBeLessThanOrEqual(4);
    });

    test("d6", () => {
      let d6 = Die.d6();
      expect(d6).toBeGreaterThanOrEqual(1);
      expect(d6).toBeLessThanOrEqual(6);
    });

    test("d8", () => {
      let d8 = Die.d6();
      expect(d8).toBeGreaterThanOrEqual(1);
      expect(d8).toBeLessThanOrEqual(8);
    });

    test("d10", () => {
      let d10 = Die.d6();
      expect(d10).toBeGreaterThanOrEqual(1);
      expect(d10).toBeLessThanOrEqual(10);
    });

    test("d12", () => {
      let d12 = Die.d12();
      expect(d12).toBeGreaterThanOrEqual(1);
      expect(d12).toBeLessThanOrEqual(12);
    });

    test("d20", () => {
      let d20 = Die.d20();
      expect(d20).toBeGreaterThanOrEqual(1);
      expect(d20).toBeLessThanOrEqual(20);
    });
  });

  test.describe("stringifying", () => {
    test.describe("description", () => {
      test("shows the die to be rolled", () => expect(new Die(6).description).toEqual("d6"));
    });

    test.describe("summary", () => {
      test("shows the value rolled", () => expect(new Die(6, {value: 3}).summary).toEqual("3"));
    });
  });
});

test.describe("DieSet", () => {
  test.describe("construction", () => {
    test("simple", () => {
      let unrolled = new DieSet(2, 4);
      expect(unrolled.length).toEqual(2);
      expect(unrolled.size).toEqual(4);
      expect([2, 3, 4, 5, 6, 7, 8]).toContain(unrolled.value);
    });

    test("with value", () => {
      let rolled = new DieSet(2, 4, {value: 3});
      expect(rolled.length).toEqual(2);
      expect(rolled.size).toEqual(4);
      expect(rolled.value).toEqual(3);
    });

    test("with target", () => {
      let rolled = new DieSet(2, 4, {value: 3, target: 6});
      expect(rolled.length).toEqual(2);
      expect(rolled.size).toEqual(4);
      expect(rolled.value).toEqual(3);
      expect(rolled.target).toEqual(6);
    });
  });

  test.describe("stringifying", () => {
    test.describe("description", () => {
      test("shows the dice to be rolled", () => expect(new DieSet(2, 6).description).toEqual("2d6"));
      test("negative", () => expect(new DieSet(2, 6, {sign: -1}).description).toEqual("-2d6"));
    });

    test.describe("summary", () => {
      test("shows the values rolled", () => expect(new DieSet(2, 6, {value: 3}).summary).toEqual("(3 + 3)"));
      test("negative", () => expect(new DieSet(2, 6, {value: 3, sign: -1}).summary).toEqual("-(3 + 3)"));
    });
  });
});

test.describe("Pools", () => {
  test.describe("construction", () => {
    test("the hard way", () => {
      let pool = new DicePool({elements: [new Flat(10), new Die(20)], target: 10});
      expect(pool.elements).toHaveLength(2);
      expect(pool.target).toEqual(10);
      expect(pool.value).toBeGreaterThan(10);
      expect(pool.value).toBeLessThanOrEqual(30);
    });

    test.describe("parsing", () => {
      test("a single flat", () => {
        let pool = DicePool.parse("5");
        expect(pool.elements).toHaveLength(1);
        expect(pool.elements[0]).toBeInstanceOf(Flat);
        expect(pool.elements.map(e => e.value)).toEqual([5]);
        expect(pool.elements.map(e => e.sign)).toEqual([1]);
      });

      test("a single negative flat", () => {
        let pool = DicePool.parse("-5");
        expect(pool.elements).toHaveLength(1);
        expect(pool.elements[0]).toBeInstanceOf(Flat);
        expect(pool.elements.map(e => e.value)).toEqual([-5]);
        expect(pool.elements.map(e => e.sign)).toEqual([-1]);
      });

      test("a single die, explicitly counted", () => {
        let pool = DicePool.parse("1d20");
        expect(pool.elements).toHaveLength(1);
        expect(pool.elements[0]).toBeInstanceOf(Die);
        expect(pool.elements.map(e => e.size)).toEqual([20]);
      });

      test("a single die, implicitly counted", () => {
        let pool = DicePool.parse("d20");
        expect(pool.elements).toHaveLength(1);
        expect(pool.elements[0]).toBeInstanceOf(Die);
        expect(pool.elements.map(e => e.size)).toEqual([20]);
      });

      test("multiple dice of the same size", () => {
        let pool = DicePool.parse("2d20");
        expect(pool.elements).toHaveLength(1);
        expect(pool.elements[0]).toBeInstanceOf(DieSet);
        expect(pool.elements.map(e => e.length)).toEqual([2]);
        expect(pool.elements.map(e => e.size)).toEqual([20]);
      });

      test("multiple elements of different sizes", () => {
        let pool = DicePool.parse("1d8+    2d20    +3");
        expect(pool.elements).toHaveLength(3);
        expect(pool.elements[0]).toBeInstanceOf(Die);
        expect(pool.elements[1]).toBeInstanceOf(DieSet);
        expect(pool.elements[2]).toBeInstanceOf(Flat);
        expect(pool.elements.map(e => e.length)).toEqual([1, 2, 1]);
        expect(pool.elements.map(e => e.size)).toEqual([8, 20, undefined]);
        expect(pool.elements[2].value).toEqual(3);
      });

      test("multiple elements with different signs", () => {
        let pool = DicePool.parse("2d100-3d2   -   4");
        expect(pool.elements).toHaveLength(3);
        expect(pool.elements[0]).toBeInstanceOf(DieSet);
        expect(pool.elements[1]).toBeInstanceOf(DieSet);
        expect(pool.elements[2]).toBeInstanceOf(Flat);
        expect(pool.elements.map(e => e.length)).toEqual([2, 3, 1]);
        expect(pool.elements.map(e => e.size)).toEqual([100, 2, undefined]);
        expect(pool.elements.map(e => e.sign)).toEqual([1, -1, -1]);
        expect(pool.elements[2].value).toEqual(-4);
      });
    });
  });

  test.describe("value", () => {
    test("with no elements, it's zero", () => {
      let pool = new DicePool({elements: []});
      expect(pool.value).toEqual(0);
    });

    test("with one element, it's the element's value", () => {
      let pool = new DicePool({elements: [new Flat(10)]});
      expect(pool.value).toEqual(10);
    });

    test("with multiple elements, it's the sum of their values", () => {
      let pool = new DicePool({elements: [new Flat(10), new Die(20, {value: 15})]});
      expect(pool.value).toEqual(25);
    });
  });

  test.describe("diff", () => {
    test("is the difference between the value and the target", () => {
      let pool = new DicePool({elements: [new Flat(10), new Die(20, {value: 15})], target: 10});
      expect(pool.diff).toEqual(15);
    });
  });

  test.describe("outcome", () => {
    let rerollNaturals = (pool, ixElement) => {
      let die = pool.elements[ixElement];
      while ([1, 20].includes(die.value)) { die.roll() }
    };

    test.describe("critical failure", () => {
      test("10+ under target is a critical failure", () => {
        let tenBelow = new DicePool({elements: [new Flat(10), new Die(20)]});
        rerollNaturals(tenBelow, 1);
        tenBelow.target = tenBelow.value + 10;
        expect(tenBelow.outcome).toEqual("criticalFailure");
      });

      test("1-9 under target with a natural one is a critical failure", () => {
        let natOne = new DicePool({elements: [new Flat(10), new Die(20, {value: 1})], target: 12});
        expect(natOne.outcome).toEqual("criticalFailure");
      });
    });

    test.describe("failure", () => {
      test("1-9 under target is a failure", () => {
        let pool = new DicePool({elements: [new Flat(10), new Die(20)]});
        rerollNaturals(pool, 1);
        pool.target = pool.value + 1;
        expect(pool.outcome).toEqual("failure");
      });

      test("10+ under target with a natural 20 is a normal failure", () => {
        let natTwenty = new DicePool({elements: [new Flat(10), new Die(20, {value: 20})], target: 100});
        expect(natTwenty.outcome).toEqual("failure");
      });

      test("1-9 over target with a natural one is a failure", () => {
        let natOne = new DicePool({elements: [new Flat(10), new Die(20, {value: 1})], target: 10});
        expect(natOne.outcome).toEqual("failure");
      });
    });

    test.describe("success", () => {
      test("1-9 over target is a success", () => {
        let pool = new DicePool({elements: [new Flat(10), new Die(20)]});
        rerollNaturals(pool, 1);
        pool.target = pool.value - 1;
        expect(pool.outcome).toEqual("success");
      });

      test("10+ over target with a natural one is a success", () => {
        let natOne = new DicePool({elements: [new Flat(10), new Die(20, {value: 1})], target: 1});
        expect(natOne.outcome).toEqual("success");
      });

      test("1-9 under target with a natural 20 is a success", () => {
        let natTwenty = new DicePool({elements: [new Flat(10), new Die(20, {value: 20})], target: 31});
        expect(natTwenty.outcome).toEqual("success");
      });
    });

    test.describe("critical success", () => {
      test("10+ over target is a critical success", () => {
        let tenAbove = new DicePool({elements: [new Flat(10), new Die(20)]});
        rerollNaturals(tenAbove, 1);
        tenAbove.target = tenAbove.value - 10;
        expect(tenAbove.outcome).toEqual("criticalSuccess");
      });

      test("1-9 over target with a natural 20 is a critical success", () => {
        let natTwenty = new DicePool({elements: [new Flat(10), new Die(20, {value: 20})], target: 19});
        expect(natTwenty.outcome).toEqual("criticalSuccess");
      });
    });
  });

  test("succeeded", () => {
    let target = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].random();
    let success = new Die(20, {target, value: target + 1});
    expect(success.succeeded).toEqual(true);

    let failure = new Die(20, {target, value: target - 1});
    expect(failure.succeeded).toEqual(false);
  });

  test("failed", () => {
    let target = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].random();
    let success = new Die(20, {target, value: target + 1});
    expect(success.failed).toEqual(false);

    let failure = new Die(20, {target, value: target - 1});
    expect(failure.failed).toEqual(true);
  });

  test.describe("stringifying", () => {
    test.describe("description", () => {
      test("shows the dice to be rolled", () => expect(DicePool.parse("2d6+3").description).toEqual("2d6 + 3"));
      test("handles negative flats later in expression", () => expect(DicePool.parse("2d6-3").description).toEqual("2d6 - 3"));
      test("handles negative dice later in expression", () => expect(DicePool.parse("10-d8").description).toEqual("10 - d8"));
      test("handles negative sets later in expression", () => expect(DicePool.parse("30-2d6").description).toEqual("30 - 2d6"));
    });

    test.describe("summary", () => {
      test("shows the dice that were rolled", () => {
        let pool = DicePool.parse("2d1+3");
        expect(pool.summary).toEqual("(1 + 1) + 3");
      });

      test("handles negative flats later in expression", () => {
        let pool = DicePool.parse("2d1-3");
        expect(pool.summary).toEqual("(1 + 1) - 3");
      });

      test("handles negative dice later in expression", () => {
        let pool = DicePool.parse("10-d1");
        expect(pool.summary).toEqual("10 - 1");
      });

      test("handles negative sets later in expression", () => {
        let pool = DicePool.parse("30-2d1");
        expect(pool.summary).toEqual("30 - (1 + 1)");
      });
    });
  });
});
