const { test, expect } = require('@playwright/test');
const { makeId } = require("../../js/models/with_id");

test("can handle strings", () =>
  expect(makeId("foo", "bar")).toMatch(/^foo--bar--[0-9a-f-]{36}/)
);
test("can handle strings with spaces", () =>
  expect(makeId("foo bar")).toMatch(/^foo-bar--[0-9a-f-]{36}/)
);
test("can handle strings with weird stuff", () =>
  expect(makeId("foo ?.#✅bar")).toMatch(/^foo-bar--[0-9a-f-]{36}/)
);
test("can handle integers", () =>
  expect(makeId(12345, "bar")).toMatch(/^12345--bar--[0-9a-f-]{36}/)
);
test("can handle objects", () =>
  expect(makeId({a: "b"}, "bar")).toMatch(/^-object-object---bar--[0-9a-f-]{36}/)
);
test("can handle nulls", () =>
  expect(makeId(null, "bar")).toMatch(/^undef--bar--[0-9a-f-]{36}/)
);
test("can handle undefined", () =>
  expect(makeId(undefined, "bar")).toMatch(/^undef--bar--[0-9a-f-]{36}/)
);
