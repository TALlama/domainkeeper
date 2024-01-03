import {Eris} from "./eris.js";

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


Eris.test("Array extensions", string => {
  string.describe("random", fn => {
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
  string.describe("first", fn => {
    fn.it("gets the first item in the array", ({assert}) =>
      assert.equals([1, 2, 3].first(), 1)
    );
    fn.it("gets undefined if no items are present", ({assert}) =>
    assert.equals([].first(), undefined)
    );
  });
  string.describe("last", fn => {
    fn.it("gets the last item in the array", ({assert}) =>
      assert.equals([1, 2, 3].last(), 3)
    );
    fn.it("gets undefined if no items are present", ({assert}) =>
      assert.equals([].last(), undefined)
    );
  });
  string.describe("count", fn => {
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
  string.describe("toDictionary", fn => {
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
