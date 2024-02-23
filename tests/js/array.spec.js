const { test, expect } = require('@playwright/test');

const {} = require('../../js/extensions');

test.describe("random", () => {
  test("gets one of the items in the array", () =>
    expect([1, 2, 3]).toContain([1, 2, 3].random())
  );
  test("gets the only item, if there is only one", () =>
    expect([1].random()).toEqual(1)
  );
  test("gets undefined if no items are present", () =>
    expect([].random()).toEqual(undefined)
  );
});

test.describe("first", () => {
  test("gets the first item in the array", () =>
    expect([1, 2, 3].first()).toEqual(1)
  );
  test("gets undefined if no items are present", () =>
  expect([].first()).toEqual(undefined)
  );
});

test.describe("last", () => {
  test("gets the last item in the array", () =>
    expect([1, 2, 3].last()).toEqual(3)
  );
  test("gets undefined if no items are present", () =>
    expect([].last()).toEqual(undefined)
  );
});

test.describe("all", () => {
  test("returns true if all items satisfy the predicate", () => {
    expect([1, 2, 3].all(i => i > 0)).toBe(true)
  });
  test("returns false if any element does not satisfy the predicate", () => {
    expect([1, 2, 3].all(i => i > 2)).toBe(false);
    expect([1, 2, 3].all(i => i < 2)).toBe(false);
  });
  test("defaults to true for empty arrays, but can be told otherwise", () => {
    expect([].all(i => i > 0)).toBe(true)
    expect([].all(i => i > 0, false)).toBe(false);
  });
  test("can also work with boolean properties", () => {
    expect( [{done: true}, {done: true }].all("done")).toBe(true)
    expect([{done: true}, {done: false}].all("done")).toBe(false);
    expect( [                           ].all("done")).toBe(true)
    expect( [                           ].all("done", false)).toBe(false);
  });
});

test.describe("sum", () => {
  test("adds up all the items", () => {
    expect([1, 2, 3].sum()).toEqual(6);
    expect([1, 2, 3].sum(i => i * 2)).toEqual(12);
    expect([1, 2, 3].sum(i => i * 2, 10)).toEqual(22);
  });
  test("can also work with properties", () => {
    expect([{n: 1}, {n: 2}, {n: 3}].sum("n")).toEqual(6);
  });
});

test.describe("count", () => {
  test("counts the items that match", () => {
    expect([1, 2, 3].count(i => i % 2 == 0)).toEqual(1);
    expect([1, 2, 3].count(i => i % 2 == 1)).toEqual(2);
    expect([1, 2, 3].count(i => i > 0)).toEqual(3);
  });
  test("gets 0 if no items are present", () =>
    expect([].count(i => i > 0)).toEqual(0)
  );
  test("explodes if no predicate is given", () =>
    expect(() => [1, 2, 3].count()).toThrow("undefined is not a function")
  );
});

test.describe("toDictionary", () => {
  test("uses each element as a key/value pair", () => {
    expect([["one", 1], ["two", 2]].toDictionary()).toEqual({one: 1, two: 2});
  });
  test("will overwrite earlier entries with later entries", () => {
    expect([["one", 1], ["one", "singular sensation"]].toDictionary()).toEqual({one: "singular sensation"});
  });

  test.describe("with a function", () => {
    test("passes each element to the function, using the result as a key/value pair", () => {
      expect(["one", "two", "three"].toDictionary(e => [e, e.length])).toEqual({one: 3, two: 3, three: 5});
    });
  })
});

test.describe("sortBy", () => {
  test("sorts by the named attribute", () => {
    expect([{n: 5}, {n: 2}, {n: 9}].sortBy("n")).toEqual([{n: 2}, {n: 5}, {n: 9}]);
  })
  test("reverse-sorts by the named attribute when prefixed by -", () => {
    expect([{n: 5}, {n: 2}, {n: 9}].sortBy("-n")).toEqual([{n: 9}, {n: 5}, {n: 2}]);
  })
  test("sorts by the function's returned value", () => {
    expect([{n: 5}, {n: 2}, {n: 9}].sortBy(o => o.n)).toEqual([{n: 2}, {n: 5}, {n: 9}]);
  })
});

test.describe("groupBy", () => {
  test("sorts by the named attribute", () => {
    expect([{n: 2, id: 1}, {n: 1, id: 2}, {n: 2, id: 3}].groupBy("n"))
      .toEqual({2: [{n: 2, id: 1}, {n: 2, id: 3}], 1: [{n: 1, id: 2}]});
  })
  test("sorts by the function's returned value", () => {
    expect([{n: 2, id: 1}, {n: 1, id: 2}, {n: 2, id: 3}].groupBy(o => o.n))
      .toEqual({2: [{n: 2, id: 1}, {n: 2, id: 3}], 1: [{n: 1, id: 2}]});
  })
});

test.describe("matches", () => {
  test("finds objects that match", () => {
    let arr = [
      {num: 1, grade: "A"},
      {num: 1, grade: "B"},
      {num: 2, grade: "A"},
      {num: 2, grade: "B"},
      {other: "Thing"},
    ]

    expect(arr.matches({num: 1})).toEqual([{num: 1, grade: "A"}, {num: 1, grade: "B"}]);
    expect(arr.matches({grade: "A"})).toEqual([{num: 1, grade: "A"}, {num: 2, grade: "A"}]);
    expect(arr.matches({})).toEqual(arr);
    expect(arr.matches([])).toEqual(arr);
    expect(arr.matches({random: "Values"})).toEqual([]);
  });
  test("finds arrays that match", () => {
    let arr = [
      [1, "A"],
      [1, "B"],
      [2, "A"],
      [2, "B"],
      [],
    ]

    var pattern = {}; pattern[0] = 1;
    expect(arr.matches([1])).toEqual([[1, "A"], [1, "B"]]);
    expect(arr.matches(pattern)).toEqual([[1, "A"], [1, "B"]]);

    pattern = {}; pattern[1] = "A";
    expect(arr.matches(pattern)).toEqual([[1, "A"], [2, "A"]]);

    expect(arr.matches({})).toEqual(arr);
    expect(arr.matches([])).toEqual(arr);
    expect(arr.matches({random: "Values"})).toEqual([]);
  });
});

test.describe("equality", () => {
  test("knows when things are equal",
    () => expect(Array.eql([1, 2, 3], [1, 2, 3])).toBe(true))
  test("knows that empty arrays are equal",
    () => expect(Array.eql([], [])).toBe(true))
  test("knows that empty arrays are equal to a `new Array`",
    () => expect(Array.eql([], new Array())).toBe(true))

  test("never thinks non-arrays are equal", () => {
    expect(Array.eql("1,2", [1, 2])).toBe(false);
    expect(Array.eql([1, 2], "1,2")).toBe(false);
    expect(Array.eql([1, 2], [1, 2].toDictionary(e => [e - 1, e]))).toBe(false);
  });
  test("isn't equal if it has a different length", () => {
    expect(Array.eql([1, 2, 3, 4], [1, 2, 3])).toBe(false);
    expect(Array.eql([1, 2, 3], [1, 2, 3, 4])).toBe(false);
  });
  test("isn't equal even if the extra element is null", () =>
    expect(Array.eql([1, 2, 3, null], [1, 2, 3])).toBe(false));
  test("isn't equal even if the extra element is undefined", () =>
    expect(Array.eql([1, 2, 3, undefined], [1, 2, 3])).toBe(false));
  test("cares about order", () =>
    expect(Array.eql([3, 2, 1], [1, 2, 3, 4])).toBe(false));
});
