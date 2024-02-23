const { test, expect } = require('@playwright/test');

const { Ability } = require('../../js/models/abilities');
const { Structure } = require('../../js/models/structure');

var structures = Structure.names.map(n => new Structure(n));
function findStructure(name) { return structures.find(s => s.name === name) }

test.describe("Cost", () => {
  test("Is 1.5x the structure's level by default", () => {
    let structure = new Structure({template: "Example", level: 2});
    expect(structure.cost).toEqual(3);

    structure = new Structure({template: "Example", level: 3});
    expect(structure.cost, "Round down").toEqual(4);
  });

  test("Is 2x the structure's level if the structure is expensive", () => {
    let structure = new Structure({template: "Example", level: 2, traits: ["Expensive"]});
    expect(structure.cost).toEqual(4);
  });

  test("Is reflected in a cost trait", () => {
    let structure = new Structure({template: "Example", level: 2});
    expect(structure.traits).toContain("Cost 3");
  });
});

test.describe("Limit", () => {
  test("Is 1 by default", () => {
    let structure = new Structure({template: "Example"});
    expect(structure.limit).toEqual(1);
  });

  test("Can be any number", () => {
    let structure = new Structure({template: "Example", limit: 2});
    expect(structure.limit).toEqual(2);
  });

  test("Is reflected in a limit trait", () => {
    let structure = new Structure({template: "Example", limit: 2});
    expect(structure.traits).toContain("Limit 2");
  });
});

test.describe("Upgrades", () => {
  test("All upgrades point to a valid structure", () => {
    let validNames = Structure.names;
    structures.forEach(structure => {
      structure.upgradeTo.forEach(upgradeTo => {
        expect.soft(validNames, `${structure.name} -> ${upgradeTo}`).toContain(upgradeTo);
      });
    });
  });

  test("All upgrades point to a higher-cost structure", () => {
    structures.forEach(structure => {
      structure.upgradeTo.forEach(upgradeTo => {
        let upgradeToStructure = findStructure(upgradeTo);
        expect.soft(upgradeToStructure.cost, `${structure.name} (${structure.cost}) -> ${upgradeTo} (${upgradeToStructure.cost})`).toBeGreaterThanOrEqual(structure.cost);
      });
    });
  });

  // This isn't strictly true, but it's still a good thing to check
  //test("Upgrades point to all downstream structures", () => {
  //  structures.forEach(structure => {
  //    structure.upgradeTo.forEach(upgradeTo => {
  //      let upgradeToStructure = findStructure(upgradeTo);
  //      upgradeToStructure.upgradeTo.forEach(downStream => {
  //        expect.soft(structure.upgradeTo, `${structure.name} -> ${upgradeTo} -> ${downStream}`).toContain(downStream);
  //      })
  //    });
  //  });
  //});
});

test.describe("Domain Ability Maximums", () => {
  test.describe("Upper bound of effectiveness", () => {
    function stats() {
      let totals = {Culture: 0, Economy: 0, Loyalty: 0, Stability: 0};
      let structuresByAbility = {Culture: [], Economy: [], Loyalty: [], Stability: []};
      structures.forEach(structure => {
        (structure.bonuses || []).forEach(bonus => {
          if (bonus.max) {
            let max = bonus.value * structure.limit;
            structuresByAbility[bonus.max].push(`+${max} ${structure.name} (x${structure.limit}) `);
            totals[bonus.max] += max;
          }
        });
        return totals;
      });
      return {totals, structuresByAbility};
    }

    test("Total boosts available for each ability should be balanced with the other abilities", () => {
      let {totals, structuresByAbility} = stats();
      Ability.all.forEach(ability => {
        expect.soft(totals[ability], `+${totals[ability]} to max ${ability}: ${structuresByAbility[ability].join("; ")}`).toBeGreaterThanOrEqual(6);
        expect.soft(totals[ability], `+${totals[ability]} to max ${ability}: ${structuresByAbility[ability].join("; ")}`).toBeLessThanOrEqual(8);
      });
    });
    
    test("Structures giving max boosts should be balanced with the other abilities", () => {
      let {totals, structuresByAbility} = stats();
      Ability.all.forEach(ability => {
        let structures = structuresByAbility[ability];
        expect.soft(structures.length, `${structures.length} structures boost ${ability}: ${structures.join("; ")}`).toBeGreaterThanOrEqual(6);
        expect.soft(structures.length, `${structures.length} structures boost ${ability}: ${structures.join("; ")}`).toBeLessThanOrEqual(7);
      });
    });
  });
});

test.describe("Activity bonuses", () => {
  test.describe("Upper bound of effectiveness", () => {
    function getActivityStats() {
      return structures.reduce((group, s) => {
        (s.bonuses || []).forEach(t => {
          if (t.activity) {
            let max = t.value * s.limit;
      
            group[t.activity] ||= {};
            let starMax = group[t.activity]["*"]?.max || 0;
      
            group[t.activity][t.ability || "*"] ||= {max: starMax, contributors: []};
            group[t.activity][t.ability || "*"].contributors.push([s.name, {value: t.value, max}])
            group[t.activity][t.ability || "*"].max += max;
            if (!t.ability) { Ability.all.forEach(a => { group[t.activity][a] && (group[t.activity][a].max += max) }) }
          }
        });
        return group;
      }, {});
    };

    test.skip("Does not exceed the maximum", () => {
      let byActivity = getActivityStats();
      console.log(JSON.stringify(byActivity, null, 2));
      Object.entries(byActivity).forEach(([activity, byAbility]) => {
        Object.entries(byAbility).forEach(([ability, {max, contributors}]) => {
          expect.soft(max, `+${max} to ${activity} with ${ability}: ${contributors.map(c => `${c[0]} (+${c[1].max})`).join("; ")}`).toBeLessThanOrEqual(5);
        });
      });
    });
  });
}); 
