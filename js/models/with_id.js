import { Eris } from "../eris.js";

let randomizer = crypto.randomUUID ? (() => crypto.randomUUID()) : (() => new Date().getTime());

export function makeId(...components) {
  return [...components, randomizer()].map(c => (c || "undef").toString().toLowerCase().replace(/[^0-9a-z-]+/g, "-")).join("--");
}

Eris.test("makeID", makeSure => {
  makeSure.it("can handle strings", ({assert}) => assert.matchesRegex(makeId("foo", "bar"), /^foo--bar--[0-9a-f-]{36}/));
  makeSure.it("can handle strings with spaces", ({assert}) => assert.matchesRegex(makeId("foo bar"), /^foo-bar--[0-9a-f-]{36}/));
  makeSure.it("can handle strings with weird stuff", ({assert}) => assert.matchesRegex(makeId("foo ?.#✅bar"), /^foo-bar--[0-9a-f-]{36}/));
  makeSure.it("can handle integers", ({assert}) => assert.matchesRegex(makeId(12345, "bar"), /^12345--bar--[0-9a-f-]{36}/));
  makeSure.it("can handle objects", ({assert}) => assert.matchesRegex(makeId({a: b}, "bar"), /^-object-object---bar--[0-9a-f-]{36}/));
  makeSure.it("can handle nulls", ({assert}) => assert.matchesRegex(makeId(null, "bar"), /^undef--bar--[0-9a-f-]{36}/));
  makeSure.it("can handle nulls", ({assert}) => assert.matchesRegex(makeId(undefined, "bar"), /^undef--bar--[0-9a-f-]{36}/));
});
