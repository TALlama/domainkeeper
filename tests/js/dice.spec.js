const { test, expect } = require('@playwright/test');
const { Flat, Die, DieSet, DicePool } = require('../../js/dice');

test.describe("Flat", () => {
  test.describe("construction", () => {
    test("positive", () => {
      let unrolled = new Flat(2);
      expect(unrolled.sides).toEqual([2]);
      expect(unrolled.value).toEqual(2);
      expect(unrolled.values).toEqual([2]);
    });

    test("negative", () => {
      let unrolled = new Flat(-2);
      expect(unrolled.sides).toEqual([-2]);
      expect(unrolled.value).toEqual(-2);
      expect(unrolled.values).toEqual([-2]);
    });
  });

  test.describe("ranges", () => {
    test("Positive", () => {
      expect(new Flat(4).range).toEqual({min: 4, max: 4});
    });

    test("Negative", () => {
      expect(new Flat(-4).range).toEqual({min: -4, max: -4});
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
      expect(rolled.values).toEqual([2]);
    });

    test("with target", () => {
      let rolled = new Die(20, {value: 12, target: 10});
      expect(rolled.size).toEqual(20);
      expect(rolled.value).toEqual(12);
      expect(rolled.target).toEqual(10);
    });
  });

  test.describe("ranges", () => {
    test("d4", () => {
      expect(new Die(4).range).toEqual({min: 1, max: 4});
    });

    test("Sign", () => {
      expect(new Die(4, {sign: -1}).range).toEqual({min: -4, max: -1});
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

  test.describe("rolls", () => {
    test("is always within the range", () => {
      let die = new Die(100);
      for (let i = 0; i < 100; i++) {
        die.roll();
        expect(die.value).toBeGreaterThanOrEqual(die.min);
        expect(die.value).toBeLessThanOrEqual(die.max);
      }
    });

    test.describe("rigged rolls", () => {
      test("determine the roll", () => {
        let die = new Die(20);
        Die.rig.push("20");

        die.roll({rigged: true});
        expect(die.value).toEqual(20);
      });

      test("get used up", () => {
        let die = new Die(20);
        Die.rig.push("13");
        Die.rig.push(5);

        die.roll({rigged: true});
        expect(die.value).toEqual(13);
        die.roll({rigged: true});
        expect(die.value).toEqual(5);
      });

      test("cannot force an impossibly high value; you end up with the max", () => {
        let die = new Die(20);
        Die.rig.push("100");

        die.roll({rigged: true});
        expect(die.value).toEqual(20);
      });

      test("cannot force an impossibly low value; you end up with the min", () => {
        let die = new Die(20);
        Die.rig.push(-100);

        die.roll({rigged: true});
        expect(die.value).toEqual(1);
      });
    });
  });

  test.describe("flatCheck", () => {
    test("returns true or false", () => {
      expect([true, false]).toContain(Die.flatCheck());
    });

    test("defaults to DC 11", () => {
      Die.rig.push([11, 20].random());
      expect(Die.flatCheck(), "Success or critical success is true").toBeTruthy();
      Die.rig.push([1, 10].random());
      expect(Die.flatCheck(), "Failure or critical failure is false").toBeFalsy();
    });

    test("can set the DC", () => {
      Die.rig.push([19, 20].random());
      expect(Die.flatCheck(19), "Success or critical success is true").toBeTruthy();
      Die.rig.push([1, 18].random());
      expect(Die.flatCheck(19), "Failure or critical failure is false").toBeFalsy();
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

    test("with values", () => {
      let rolled = new DieSet(2, 4, {values: [1, 2]});
      expect(rolled.length).toEqual(2);
      expect(rolled.size).toEqual(4);
      expect(rolled.values).toEqual([1, 2]);
      expect(rolled.value).toEqual(3);
    });

    test("with value", () => {
      let rolled = new DieSet(2, 4, {value: 3});
      expect(rolled.length).toEqual(2);
      expect(rolled.size).toEqual(4);
      expect(rolled.value).toEqual(3);
      expect(rolled.values).toEqual([2, 1]);
    });

    test("with target", () => {
      let rolled = new DieSet(2, 4, {value: 3, target: 6});
      expect(rolled.length).toEqual(2);
      expect(rolled.size).toEqual(4);
      expect(rolled.value).toEqual(3);
      expect(rolled.target).toEqual(6);
    });
  });

  test.describe("ranges", () => {
    test("Single die", () => {
      let die = new DieSet(1, 4);
      expect(die.min).toEqual(1);
      expect(die.max).toEqual(4);
    });

    test("Multiple dice", () => {
      let die = new DieSet(3, 6);
      expect(die.min).toEqual(3);
      expect(die.max).toEqual(18);
    });

    test("Multiple dice, signed", () => {
      let die = new DieSet(3, 6, {sign: -1});
      expect(die.min).toEqual(-18);
      expect(die.max).toEqual(-3);
    });
  });

  test.describe("stringifying", () => {
    test.describe("description", () => {
      test("shows the dice to be rolled", () => expect(new DieSet(2, 6).description).toEqual("2d6"));
      test("negative", () => expect(new DieSet(2, 6, {sign: -1}).description).toEqual("-2d6"));
    });

    test.describe("summary", () => {
      test("shows the values rolled", () => expect(new DieSet(2, 6, {value: 3}).summary).toEqual("(2 + 1)"));
      test("negative", () => expect(new DieSet(2, 6, {value: 3, sign: -1}).summary).toEqual("-(2 + 1)"));
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
      expect(pool.values).toHaveLength(2);
      expect(pool.values[0]).toEqual(10);
      expect(pool.values[1]).toBeGreaterThanOrEqual(1);
      expect(pool.values[1]).toBeLessThanOrEqual(20);
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

      test.describe("a single die, explicitly counted", () => {
        test("unrolled", () => {
          let pool = DicePool.parse("1d20");
          expect(pool.elements).toHaveLength(1);
          expect(pool.elements[0]).toBeInstanceOf(Die);
          expect(pool.elements.map(e => e.size)).toEqual([20]);
        });

        test("with element values given", () => {
          let pool = DicePool.parse("1d20", {values: [15], target: 10});
          expect(pool.elements).toHaveLength(1);
          expect(pool.elements[0]).toBeInstanceOf(Die);
          expect(pool.elements.map(e => e.size)).toEqual([20]);
          expect(pool.elements.map(e => e.value)).toEqual([15]);
          expect(pool.value).toEqual(15);
          expect(pool.target).toEqual(10);
          expect(pool.diff).toEqual(5);
          expect(pool.outcome).toEqual("success");
          expect(pool.succeeded).toEqual(true);
        });
      });

      test.describe("a single die, implicitly counted", () => {
        test("unrolled", () => {
          let pool = DicePool.parse("d20");
          expect(pool.elements).toHaveLength(1);
          expect(pool.elements[0]).toBeInstanceOf(Die);
          expect(pool.elements.map(e => e.size)).toEqual([20]);
        });

        test("with element values given", () => {
          let pool = DicePool.parse("d20", {values: [15], target: 10});
          expect(pool.elements).toHaveLength(1);
          expect(pool.elements[0]).toBeInstanceOf(Die);
          expect(pool.elements.map(e => e.size)).toEqual([20]);
          expect(pool.elements.map(e => e.value)).toEqual([15]);
          expect(pool.value).toEqual(15);
          expect(pool.target).toEqual(10);
          expect(pool.diff).toEqual(5);
          expect(pool.outcome).toEqual("success");
          expect(pool.succeeded).toEqual(true);
        });

        test("with total value given", () => {
          let pool = DicePool.parse("d20", {value: 15, target: 10});
          expect(pool.elements).toHaveLength(1);
          expect(pool.elements[0]).toBeInstanceOf(Die);
          expect(pool.elements.map(e => e.size)).toEqual([20]);
          expect(pool.elements.map(e => e.value)).toEqual([15]);
          expect(pool.value).toEqual(15);
          expect(pool.target).toEqual(10);
          expect(pool.diff).toEqual(5);
          expect(pool.outcome).toEqual("success");
          expect(pool.succeeded).toEqual(true);
        });
      });

      test.describe("multiple dice of the same size", () => {
        test("unrolled", () => {
          let pool = DicePool.parse("2d20");
          expect(pool.elements).toHaveLength(1);
          expect(pool.elements[0]).toBeInstanceOf(DieSet);
          expect(pool.elements.map(e => e.length)).toEqual([2]);
          expect(pool.elements.map(e => e.size)).toEqual([20]);
        });

        test("with element values given", () => {
          let pool = DicePool.parse("2d20", {values: [[2, 13]], target: 10});
          expect(pool.elements).toHaveLength(1);
          expect(pool.elements[0]).toBeInstanceOf(DieSet);
          expect(pool.elements.map(e => e.length)).toEqual([2]);
          expect(pool.elements.map(e => e.size)).toEqual([20]);
          expect(pool.elements.map(e => e.value)).toEqual([15]);
          expect(pool.value).toEqual(15);
          expect(pool.values).toEqual([[2, 13]]);
          expect(pool.target).toEqual(10);
          expect(pool.diff).toEqual(5);
          expect(pool.outcome).toEqual("success");
          expect(pool.succeeded).toEqual(true);
        });

        test("with total value given", () => {
          let pool = DicePool.parse("2d20", {value: 15, target: 10});
          expect(pool.elements).toHaveLength(1);
          expect(pool.elements[0]).toBeInstanceOf(DieSet);
          expect(pool.elements.map(e => e.length)).toEqual([2]);
          expect(pool.elements.map(e => e.size)).toEqual([20]);
          expect(pool.elements.map(e => e.value)).toEqual([15]);
          expect(pool.value).toEqual(15);
          expect(pool.values).toEqual([[8, 7]]);
          expect(pool.target).toEqual(10);
          expect(pool.diff).toEqual(5);
          expect(pool.outcome).toEqual("success");
          expect(pool.succeeded).toEqual(true);
        });
      });

      test.describe("multiple elements of different sizes", () => {
        test("unrolled", () => {
          let pool = DicePool.parse("1d8+    2d20    +3");
          expect(pool.elements).toHaveLength(3);
          expect(pool.elements[0]).toBeInstanceOf(Die);
          expect(pool.elements[1]).toBeInstanceOf(DieSet);
          expect(pool.elements[2]).toBeInstanceOf(Flat);
          expect(pool.elements.map(e => e.length)).toEqual([1, 2, 1]);
          expect(pool.elements.map(e => e.size)).toEqual([8, 20, undefined]);
          expect(pool.elements[2].value).toEqual(3);
        });

        test("with element values given", () => {
          let pool = DicePool.parse("1d8+    2d20    +3", {values: [5, [2, 13], 3]});
          expect(pool.elements).toHaveLength(3);
          expect(pool.elements[0]).toBeInstanceOf(Die);
          expect(pool.elements[1]).toBeInstanceOf(DieSet);
          expect(pool.elements[2]).toBeInstanceOf(Flat);
          expect(pool.elements.map(e => e.length)).toEqual([1, 2, 1]);
          expect(pool.elements.map(e => e.size)).toEqual([8, 20, undefined]);
          expect(pool.values).toEqual([5, [2, 13], 3]);
          expect(pool.value).toEqual(23);
        });

        test("with total value given", () => {
          let pool = DicePool.parse("1d8+    2d20    +3", {value: 23});
          expect(pool.elements).toHaveLength(3);
          expect(pool.elements[0]).toBeInstanceOf(Die);
          expect(pool.elements[1]).toBeInstanceOf(DieSet);
          expect(pool.elements[2]).toBeInstanceOf(Flat);
          expect(pool.elements.map(e => e.length)).toEqual([1, 2, 1]);
          expect(pool.elements.map(e => e.size)).toEqual([8, 20, undefined]);
          expect(pool.values).toEqual([8, [6, 6], 3]);
          expect(pool.value).toEqual(23);
        });
      });

      test.describe("multiple elements with different signs", () => {
        test("unrolled", () => {
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

        test("with element values given", () => {
          let pool = DicePool.parse("2d100-3d2   -   4", {values: [[2, 99], [-1, -2, -1], -4]});
          expect(pool.elements).toHaveLength(3);
          expect(pool.elements[0]).toBeInstanceOf(DieSet);
          expect(pool.elements[1]).toBeInstanceOf(DieSet);
          expect(pool.elements[2]).toBeInstanceOf(Flat);
          expect(pool.elements.map(e => e.length)).toEqual([2, 3, 1]);
          expect(pool.elements.map(e => e.size)).toEqual([100, 2, undefined]);
          expect(pool.values).toEqual([[2, 99], [-1, -2, -1], -4]);
          expect(pool.value).toEqual(93);
        });

        test.describe("with total value given", () => {
          test("with total value given", () => {
            let pool = DicePool.parse("2d100 - 3d2 - 4", {value: 93});
            expect(pool.values).toEqual([[52, 51], [-2, -2, -2], -4]);
            expect(pool.value).toEqual(93);
          });

          test("where negative must be minimized", () => {
            let pool = DicePool.parse("1d10 - 3d2", {value: 7});
            expect(pool.values).toEqual([10, [-1, -1, -1]]);
            expect(pool.value).toEqual(7);
          });

          test("where negative must be minimized, with negative flat", () => {
            let pool = DicePool.parse("1d10 - 3d2 - 4", {value: 3});
            expect(pool.values).toEqual([10, [-1, -1, -1], -4]);
            expect(pool.value).toEqual(3);
          });

          test("where negative must be minimized, with positive flat", () => {
            let pool = DicePool.parse("1d10 - 3d2 + 4", {value: -1});
            expect(pool.values).toEqual([1, [-2, -2, -2], 4]);
            expect(pool.value).toEqual(-1);
          });
        });
      });
    });
  });

  test.describe("ranges", () => {
    test("Single element pool is the same as its element", () => {
      expect(DicePool.parse("1d4").range).toEqual({min: 1, max: 4});
    });

    test("Multiple element pool is the sum as its elements", () => {
      expect(DicePool.parse("2d4 + 1d8 + 3").range).toEqual({min: 6, max: 19});
    });

    test("Multiple element pool is the sum as its elements, even if some are negative", () => {
      expect(DicePool.parse("2d4 - 1d8 + 3").range).toEqual({min: -3, max: 10});
      expect(DicePool.parse("2d4 + 1d8 - 3").range).toEqual({min: 0, max: 13});
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

  test.describe("rolls", () => {
    test("is always in range", () => {
      let desc = [`2d20`, ["+", "-"].random(), [`1d4`, 4, `10d2`]].join(" ");
      let pool = DicePool.parse(desc);

      for (let i = 0; i < 100; i++) {
        pool.roll();
        expect(pool.value).toBeGreaterThanOrEqual(pool.min);
        expect(pool.value).toBeLessThanOrEqual(pool.max);
      }
    });

    test.describe("rigged rolls", () => {
      test("determine the roll", () => {
        let pool = DicePool.parse("d20 + 4");
        DicePool.rig.push("24");

        pool.roll({rigged: true});
        expect(pool.value).toEqual(24);
        expect(pool.values).toEqual([20, 4]);
      });

      test("get used up", () => {
        let pool = DicePool.parse("d20 + 4");
        DicePool.rig.push("24");
        DicePool.rig.push(5);

        pool.roll({rigged: true});
        expect(pool.value).toEqual(24);
        expect(pool.values).toEqual([20, 4]);
        pool.roll({rigged: true});
        expect(pool.value).toEqual(5);
        expect(pool.values).toEqual([1, 4]);
      });

      test("cannot force an impossibly high value; you end up with the max", () => {
        let pool = DicePool.parse("d20 + 4");
        DicePool.rig.push("100");

        pool.roll({rigged: true});
        expect(pool.value).toEqual(24);
        expect(pool.values).toEqual([20, 4]);
      });

      test("cannot force an impossibly low value; you end up with the min", () => {
        let pool = DicePool.parse("d20 + 4");
        DicePool.rig.push(-100);

        pool.roll({rigged: true});
        expect(pool.values).toEqual([1, 4]);
        expect(pool.value).toEqual(5);
      });
    });
  });
});
