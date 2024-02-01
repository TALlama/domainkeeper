import { Eris } from "./eris.js";
import "./extensions.js";

Eris.test("Array extensions", array => {
  array.describe("random", fn => {
    fn.it("gets one of the items in the array", ({assert}) =>
      assert.includedIn([1, 2, 3].random(), [1, 2, 3])
    );
    fn.it("gets the only item, if there is only one", ({assert}) =>
      assert.equals([1].random(), 1)
    );
    fn.it("gets undefined if no items are present", ({assert}) =>
      assert.equals([].random(), undefined)
    );
  });
  array.describe("first", fn => {
    fn.it("gets the first item in the array", ({assert}) =>
      assert.equals([1, 2, 3].first(), 1)
    );
    fn.it("gets undefined if no items are present", ({assert}) =>
    assert.equals([].first(), undefined)
    );
  });
  array.describe("last", fn => {
    fn.it("gets the last item in the array", ({assert}) =>
      assert.equals([1, 2, 3].last(), 3)
    );
    fn.it("gets undefined if no items are present", ({assert}) =>
      assert.equals([].last(), undefined)
    );
  });
  array.describe("all", fn => {
    fn.it("returns true if all items satisfy the predicate", ({assert}) => {
      assert.true([1, 2, 3].all(i => i > 0));
    });
    fn.it("returns false if any element does not satisfy the predicate", ({assert}) => {
      assert.false([1, 2, 3].all(i => i > 2));
      assert.false([1, 2, 3].all(i => i < 2));
    });
    fn.it("defaults to true for empty arrays, but can be told otherwise", ({assert}) => {
      assert.true([].all(i => i > 0));
      assert.false([].all(i => i > 0, false));
    });
    fn.it("can also work with boolean properties", ({assert}) => {
      assert.true( [{done: true}, {done: true }].all("done"));
      assert.false([{done: true}, {done: false}].all("done"));
      assert.true( [                           ].all("done"));
      assert.false( [                           ].all("done", false));
    });
  });
  array.describe("sum", fn => {
    fn.it("adds up all the items", ({assert}) => {
      assert.equals([1, 2, 3].sum(), 6);
      assert.equals([1, 2, 3].sum(i => i * 2), 12);
      assert.equals([1, 2, 3].sum(i => i * 2, 10), 22);
    });
    fn.it("can also work with properties", ({assert}) => {
      assert.equals([{n: 1}, {n: 2}, {n: 3}].sum("n"), 6);
    });
  });
  array.describe("count", fn => {
    fn.it("counts the items that match", ({assert}) => {
      assert.equals([1, 2, 3].count(i => i % 2 == 0), 1);
      assert.equals([1, 2, 3].count(i => i % 2 == 1), 2);
      assert.equals([1, 2, 3].count(i => i > 0), 3);
    });
    fn.it("gets 0 if no items are present", ({assert}) =>
      assert.equals([].count(i => i > 0), 0)
    );
    fn.it("explodes if no predicate is given", ({assert}) =>
      assert.expectError(() => [1, 2, 3].count(), "TypeError")
    );
  });
  array.describe("toDictionary", fn => {
    fn.it("uses each element as a key/value pair", ({assert}) => {
      assert.jsonEquals([["one", 1], ["two", 2]].toDictionary(), {one: 1, two: 2});
    });
    fn.it("will overwrite earlier entries with later entries", ({assert}) => {
      assert.jsonEquals([["one", 1], ["one", "singular sensation"]].toDictionary(), {one: "singular sensation"});
    });

    fn.describe("with a function", fnfn => {
      fnfn.it("passes each element to the function, using the result as a key/value pair", ({assert}) => {
        assert.jsonEquals(["one", "two", "three"].toDictionary(e => [e, e.length]), {one: 3, two: 3, three: 5});
      });
    })
  });
  array.describe("sortBy", fn => {
    fn.it("sorts by the named attribute", ({assert}) => {
      assert.jsonEquals([{n: 5}, {n: 2}, {n: 9}].sortBy("n"), [{n: 2}, {n: 5}, {n: 9}]);
    })
    fn.it("reverse-sorts by the named attribute when prefixed by -", ({assert}) => {
      assert.jsonEquals([{n: 5}, {n: 2}, {n: 9}].sortBy("-n"), [{n: 9}, {n: 5}, {n: 2}]);
    })
    fn.it("sorts by the function's returned value", ({assert}) => {
      assert.jsonEquals([{n: 5}, {n: 2}, {n: 9}].sortBy(o => o.n), [{n: 2}, {n: 5}, {n: 9}]);
    })
  });
  array.describe("groupBy", fn => {
    fn.it("sorts by the named attribute", ({assert}) => {
      assert.jsonEquals([{n: 2, id: 1}, {n: 1, id: 2}, {n: 2, id: 3}].groupBy("n"),
        {2: [{n: 2, id: 1}, {n: 2, id: 3}], 1: [{n: 1, id: 2}]});
    })
    fn.it("sorts by the function's returned value", ({assert}) => {
      assert.jsonEquals([{n: 2, id: 1}, {n: 1, id: 2}, {n: 2, id: 3}].groupBy(o => o.n), 
      {2: [{n: 2, id: 1}, {n: 2, id: 3}], 1: [{n: 1, id: 2}]});
    })
  });

  array.describe("matches", fn => {
    fn.it("finds objects that match", ({assert}) => {
      let arr = [
        {num: 1, grade: "A"},
        {num: 1, grade: "B"},
        {num: 2, grade: "A"},
        {num: 2, grade: "B"},
        {other: "Thing"},
      ]

      assert.jsonEquals(arr.matches({num: 1}), [{num: 1, grade: "A"}, {num: 1, grade: "B"}]);
      assert.jsonEquals(arr.matches({grade: "A"}), [{num: 1, grade: "A"}, {num: 2, grade: "A"}]);
      assert.jsonEquals(arr.matches({}), arr);
      assert.jsonEquals(arr.matches([]), arr);
      assert.jsonEquals(arr.matches({random: "Values"}), []);
    });
    fn.it("finds arrays that match", ({assert}) => {
      let arr = [
        [1, "A"],
        [1, "B"],
        [2, "A"],
        [2, "B"],
        [],
      ]

      var pattern = {}; pattern[0] = 1;
      assert.jsonEquals(arr.matches([1]), [[1, "A"], [1, "B"]]);
      assert.jsonEquals(arr.matches(pattern), [[1, "A"], [1, "B"]]);

      pattern = {}; pattern[1] = "A";
      assert.jsonEquals(arr.matches(pattern), [[1, "A"], [2, "A"]]);

      assert.jsonEquals(arr.matches({}), arr);
      assert.jsonEquals(arr.matches([]), arr);
      assert.jsonEquals(arr.matches({random: "Values"}), []);
    });
  });
  array.describe("equality", makeSure => {
    makeSure.it("knows when things are equal",
      ({assert}) => assert.true(Array.eql([1, 2, 3], [1, 2, 3])));
    makeSure.it("knows that empty arrays are equal",
      ({assert}) => assert.true(Array.eql([], [])));
    makeSure.it("knows that empty arrays are equal to a `new Array`",
      ({assert}) => assert.true(Array.eql([], new Array())));

    makeSure.it("never things non-arrays are equal", ({assert}) => {
      assert.false(Array.eql("1,2", [1, 2]));
      assert.false(Array.eql([1, 2], "1,2"));
      assert.false(Array.eql([1, 2], [1, 2].toDictionary(e => [e - 1, e])));
    });
    makeSure.it("isn't equal if it has a different length", ({assert}) => {
      assert.false(Array.eql([1, 2, 3, 4], [1, 2, 3]));
      assert.false(Array.eql([1, 2, 3], [1, 2, 3, 4]));
    });
    makeSure.it("isn't equal even if the extra element is null", ({assert}) =>
      assert.false(Array.eql([1, 2, 3, null], [1, 2, 3])));
    makeSure.it("isn't equal even if the extra element is undefined", ({assert}) =>
      assert.false(Array.eql([1, 2, 3, undefined], [1, 2, 3])));
    makeSure.it("cares about order", ({assert}) =>
      assert.false(Array.eql([3, 2, 1], [1, 2, 3, 4])));
  });
});

Eris.test("String extensions", string => {
  string.describe("escapeHtml", fn => {
    fn.it("does not change normal strings", ({assert}) =>
      assert.equals("foo bar".escapeHtml(), "foo bar")
    );
    fn.it("escapes angle brackets", ({assert}) =>
      assert.equals("<foo-bar>".escapeHtml(), "&lt;foo-bar&gt;")
    );
    fn.it("escapes ampersands", ({assert}) =>
      assert.equals("foo & bar".escapeHtml(), "foo &amp; bar")
    );
  });
});
