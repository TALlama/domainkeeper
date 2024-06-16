const { test, expect } = require('@playwright/test');
const { Domain } = require('../../js/models/domain');
const { Requirement, ImpossibleRequirement } = require('../../js/models/requirement');
const { allFeats, stabilityFeats } = require('../../js/models/feat_templates/all_feats');

test.describe("Domain requirements", () => {
  test.describe(`Level requirements`, () => {
    const def = {ability: "Level", value: 10};

    test(`description`, async ({ page }) => {
      let req = Requirement.evaluate(new Domain({}), def);
      expect(req.description).toEqual(`Requires level 10`);
    });
    
    test(`when the stat is higher than the value`, async ({ page }) => {
      let domain = new Domain({level: 12});
      let req = domain.checkRequirements(def);
      expect(req.met).toBeTruthy();
    });

    test(`when the stat is lower than the value`, async ({ page }) => {
      let domain = new Domain({level: 2});
      let req = domain.checkRequirements(def);
      expect(req.met).toBeFalsy();
    });
  });

  test.describe(`Stat requirements`, () => {
    const def = {ability: "Culture", value: 10};

    test(`description`, async ({ page }) => {
      let req = Requirement.evaluate(new Domain({}), def);
      expect(req.description).toEqual(`Culture must be 10 or higher`);
    });
    
    test(`when the stat is higher than the value`, async ({ page }) => {
      let domain = new Domain({culture: 12});
      let req = domain.checkRequirements(def);
      expect(req.met).toBeTruthy();
    });

    test(`when the stat is lower than the value`, async ({ page }) => {
      let domain = new Domain({culture: 2});
      let req = domain.checkRequirements(def);
      expect(req.met).toBeFalsy();
    });
  });

  test.describe(`Max Ability requirements`, () => {
    const def = {maxAbility: "Culture", value: 6};

    test(`description`, async ({ page }) => {
      let req = Requirement.evaluate(new Domain({}), def);
      expect(req.description).toEqual(`Culture max must be 6 or higher`);
    });
    
    test(`when the max is higher than the value`, async ({ page }) => {
      let domain = new Domain({settlements: [{powerups: [{name: "Festival Hall"}]}]});
      let req = domain.checkRequirements(def);
      expect(req.met).toBeTruthy();
    });

    test(`when the max is lower than the value`, async ({ page }) => {
      let domain = new Domain({});
      let req = domain.checkRequirements(def);
      expect(req.met).toBeFalsy();
    });
  });

  test.describe(`Feat requirements`, () => {
    const def = {feat: "Practical Magic"};

    test(`description`, async ({ page }) => {
      let req = Requirement.evaluate(new Domain({}), def);
      expect(req.description).toEqual(`Practical Magic feat`);
    });
    
    test(`when we have the feat in question`, async ({ page }) => {
      let domain = new Domain({feats: [{name: "Practical Magic"}]});
      let req = domain.checkRequirements(def);
      expect(req.met).toBeTruthy();
    });

    test(`when we don't have the feat`, async ({ page }) => {
      let domain = new Domain({});
      let req = domain.checkRequirements(def);
      expect(req.met).toBeFalsy();
    });
  });

  test.describe(`Multiple requirements`, () => {
    const def = [{ability: "Culture", value: 10}, {ability: "Stability", value: 10}];

    test(`description`, async ({ page }) => {
      let req = Requirement.evaluate(new Domain({}), ...def);
      expect(req.description).toEqual(`Culture must be 10 or higher\nStability must be 10 or higher`);
    });
    
    test(`when all the requirements are met`, async ({ page }) => {
      let domain = new Domain({culture: 10, stability: 10});
      let req = domain.checkRequirements(...def);
      expect(req.met).toBeTruthy();
    });

    test(`when any requirement is not met`, async ({ page }) => {
      let values = [10, 9, 8].shuffle();
      let domain = new Domain({culture: values.shift(), stability: values.shift()});
      let req = domain.checkRequirements(...def);
      expect(req.met).toBeFalsy();
    });
  });

  test("covers all feat requirements", async ({ page }) => {
    let prereqs = allFeats.flatMap(feat =>
      (feat.prerequisites || []).map(prereq => {return {...prereq, sourceFeat: feat.name}})
    );
    let reqs = Requirement.evaluate(new Domain({}), ...prereqs);
    let impossible = reqs.children.filter(req => req.constructor === ImpossibleRequirement);
    expect(impossible.map(req => req.description)).toEqual([]);
  });
});
