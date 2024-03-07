const { test, expect } = require('@playwright/test');
const { Milestone } = require('../../js/models/milestone');
const { Actor } = require('../../js/models/actor');

test.describe("Given a milestone name, finds other properties", () => {
  test("For a milestone with a template", ({ page }) => {
    const milestone = new Milestone("Domain size 5");
    expect.soft(milestone.name).toEqual("Domain size 5");
    expect.soft(milestone.xp).toEqual(20);
    expect.soft(milestone.trigger).toEqual("size");
    expect.soft(milestone.message).toBeDefined();
    expect.soft(milestone.check({size: 4})).toBeFalsy()
    expect.soft(milestone.check({size: 5})).toBeTruthy();
    expect.soft(milestone.check({size: 6})).toBeFalsy();
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
  function makeDomain(properties = {}) { return {milestones: {}, size: 1, settlements: [], properties} };
  function check(trigger, domain) { return Milestone.check(trigger, domain).map(m => m.name) }

  test("When we hit a certain size", () => {
    expect(check("size", makeDomain({size: 1}))).toEqual([]);
    expect(check("size", makeDomain({size: 5}))).toEqual(["Domain size 5"]);
    expect(check("size", makeDomain({size: 25}))).toEqual(["Domain size 25"]);
  });

  test.describe("When settlements", () => {
    test("by default, have nothing", ({ page }) => {
      expect(check("settlements", makeDomain())).toEqual([]);
    });

    test("Are placed", ({ page }) => {
      let domain = makeDomain();
      domain.settlements.push(new Actor({name: "Capital!", position: [0, 0]}));
      expect(check("settlements", domain)).toEqual(["Capital founded"]);
    });

    test("Number 2", ({ page }) => {
      let domain = makeDomain();
      domain.settlements.push(new Actor({name: "Capital!", position: [0, 0]}));
      domain.settlements.push(new Actor({name: "Not the Capital!", position: [10, 10]}));
      expect(check("settlements", domain)).toEqual(["Capital founded", "Second settlement founded"]);
    });
  });
});

test("No two templates can have the same name", ({ page }) => {
  let uniqueNames = new Set();
  Milestone.templates.map(t => t.name).forEach(name => {
    expect.soft(uniqueNames.has(name), name).toBeFalsy();
    uniqueNames.add(name);
  });
});
