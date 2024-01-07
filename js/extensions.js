import { Eris } from "./eris.js";

/* Array extensions */
Array.prototype.random = Array.prototype.random || function() { return this[Math.floor((Math.random()*this.length))] };
Array.prototype.first = Array.prototype.first || function() { return this[0] }
Array.prototype.last = Array.prototype.last || function() { return this[this.length - 1] }
Array.prototype.count = Array.prototype.count || function(fn) { return this.filter(fn).length }
Array.prototype.toDictionary = Array.prototype.toDictionary || function(fn) {
  let retval = {};
  this.forEach(element => {
    let [key, value] = fn ? fn(element) : element;
    retval[key] = value;
  });
  return retval;
}
Array.prototype.sortBy = Array.prototype.sortBy || function(attr) {
  if (attr[0] == "-") { return this.sortBy(attr.substr(1)).reverse() }

  return this.sort((a, b) => {
    let aVal = attr.call ? attr(a) : a[attr];
    let bVal = attr.call ? attr(b) : b[attr];
    return aVal > bVal ? 1 : -1;
  })
};
Array.prototype.matches = Array.prototype.matches || function(pattern) {
  return this.filter(object =>
    Object.keys(pattern).reduce((all, key) => all && (pattern[key] === object[key]), true)
  );
}
Array.eql = Array.eql || function(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((e, ix) => b[ix] === e);
}

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
  })
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

/* String extentions */
String.prototype.escapeHtml = String.prototype.escapeHtml || function() {
  const el = document.createElement("div");
  el.innerText = this;
  return el.innerHTML;
}

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
