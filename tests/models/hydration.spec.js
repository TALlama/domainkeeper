const { test, expect } = require('@playwright/test');
const { addTransient } = require("../../js/models/utils");

test.describe("addTransient", () => {
  test("can add properties to an object that aren't reflected in its JSON output", () => {
    let obj = {num: 1, arr: [1, 2, 3]};
    expect(obj).toEqual({num: 1, arr: [1, 2, 3]});

    addTransient(obj, {name: "color"});
    obj.color = "red";
    expect(obj).toEqual({num: 1, arr: [1, 2, 3]});
  });
});
