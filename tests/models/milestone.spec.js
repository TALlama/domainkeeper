const { test, expect } = require('@playwright/test');
const { Milestone } = require('../../js/models/milestone');

test.describe("Given a milestone name, finds other properties", () => {
  test("For a milestone with a template", ({ page }) => {
    const milestone = new Milestone("Domain size 2");
    expect.soft(milestone.name).toEqual("Domain size 2");
    expect.soft(milestone.xp).toEqual(20);
    expect.soft(milestone.trigger).toEqual("size");
    expect.soft(milestone.message).toBeDefined();
    expect.soft(milestone.check({size: 1})).toBeFalsy()
    expect.soft(milestone.check({size: 2})).toBeTruthy();
    expect.soft(milestone.check({size: 3})).toBeFalsy();
  });

  test("For a milestone with a non-existant template", ({ page }) => {
    const milestone = new Milestone("500 Miles (and 500 more)");
    expect.soft(milestone.name).toEqual("500 Miles (and 500 more)");
    expect.soft(milestone.xp).toEqual(0);
    expect.soft(milestone.trigger).toEqual("--none--");
    expect.soft(milestone.message).toBeDefined();
    expect.soft(milestone.check({})).toBeFalsy()
  });
});

test.describe("Can get all milestones that the current domain hit", () => {
  test("When we hit a certain size", () => {
    expect(Milestone.check("size", {milestones: {}, size: 1}).map(m => m.name)).toEqual([]);
    expect(Milestone.check("size", {milestones: {}, size: 2}).map(m => m.name)).toEqual(["Domain size 2"]);
    expect(Milestone.check("size", {milestones: {}, size: 25}).map(m => m.name)).toEqual(["Domain size 25"]);
  });
});

test("No two templates can have the same name", ({ page }) => {
  let uniqueNames = new Set();
  Milestone.templates.map(t => t.name).forEach(name => {
    expect.soft(uniqueNames.has(name), name).toBeFalsy();
    uniqueNames.add(name);
  });
});
