const { test, expect } = require('@playwright/test');

const { mod, displayBonus, describeRoll } = require('../js/helpers');

const { Feat } = require('../js/models/feat');
const { Structure } = require('../js/models/structure');

test.describe("mod", () => {
  test("positive numbers", () => {
    expect(mod(1)).toEqual("+1");
    expect(mod(2)).toEqual("+2");
  });

  test("negative numbers", () => {
    expect(mod(-1)).toEqual("-1");
    expect(mod(-2)).toEqual("-2");
  });

  test("zero", () => {
    expect(mod(0)).toEqual("+0");
  });
});

test.describe("displayBonus", () => {
  test("with description", () => {
    expect(displayBonus({description: "This is a test"})).toEqual("This is a test");
  });

  test("unknown bonus", () => {
    expect(displayBonus({})).toContain("UNKNOWN BONUS");
  });
  
  test.describe("activity bonus", () => {
    test("whole activity", () => {
      expect(displayBonus({activity: "Reticulate Splines", value: 2})).toEqual("⏩ +2 to Reticulate Splines") ;
      expect(displayBonus({activity: "Reticulate Splines", value: -2})).toEqual("⏩ -2 to Reticulate Splines") ;
    });

    test("activity with ability", () => {
      expect(displayBonus({activity: "Reticulate Splines", ability: "Culture", value: 2})).toEqual("⏩ +2 to Reticulate Splines using Culture") ;
    });

    test("activity with unit", () => {
      expect(displayBonus({activity: "Reticulate Splines", unit: "Triangle", value: 2})).toEqual("⏩ +2 to Reticulate Splines for Triangle") ;
      expect(displayBonus({activity: "Reticulate Splines", unit: "Triangle", ability: "Stability", value: 2})).toEqual("⏩ +2 to Reticulate Splines for Triangle using Stability") ;
    });

    test("activity with structure", () => {
      expect(displayBonus({activity: "Reticulate Splines", structure: "Triangle", value: 2})).toEqual("⏩ +2 to Reticulate Splines for Triangle") ;
      expect(displayBonus({activity: "Reticulate Splines", structure: "Triangle", ability: "Stability", value: 2})).toEqual("⏩ +2 to Reticulate Splines for Triangle using Stability") ;
    });
  });

  test.describe("max bonus", () => {
    test("positive", () => {
      expect(displayBonus({max: "Culture", value: 2})).toEqual("⬆️ +2 to maximum Culture") ;
    });

    test("negative", () => {
      expect(displayBonus({max: "Culture", value: -2})).toEqual("⬇️ -2 to maximum Culture") ;
    });
  });
  
  test.describe("unlock", () => {
    test("whole activities", () => {
      expect(displayBonus({type: "unlock", activity: "Reticulate Splines"})).toEqual("🔒 Unlock activity: Reticulate Splines") ;
    });

    test("specific units", () => {
      expect(displayBonus({type: "unlock", activity: "Recruit Army", unit: "Dragon"})).toEqual("🔒 Unlock activity: Recruit Army for Dragon") ;
    });

    test("specific structures", () => {
      expect(displayBonus({type: "unlock", activity: "Build Infrastructure", structure: "Playground"})).toEqual("🔒 Unlock activity: Build Infrastructure for Playground") ;
    });
  });
  
  test.describe("covers all bonuses", () => {
    test("given by structures", () => {
      let bonuses = Structure.templates
        .flatMap(s => (s.bonuses || []).map(b => { return {...b, _source: s.name}}));
      bonuses
        .forEach(bonus => {
          let text = displayBonus(bonus);
          console.log(text, bonus);
          expect.soft(text, `Unknown bonus: ${JSON.stringify(bonus)}`).not.toContain("UNKNOWN BONUS");
        });
    });

    test("given by feats", () => {
      let bonuses = Feat.templates
        .flatMap(f => (f.bonuses || []).map(b => { return {...b, _source: f.name}}));
      bonuses
        .forEach(bonus => {
          let text = displayBonus(bonus);
          console.log(text, bonus);
          expect.soft(text, `Unknown bonus: ${JSON.stringify(bonus)}`).not.toContain("UNKNOWN BONUS");
        });
    });
  });
});

test.describe("describeRoll", () => {
  test("no details", () => {
    expect(describeRoll({})).toEqual("any check");
  });

  test.describe("with activity", () => {
    test("alone", () => {
      expect(describeRoll({activity: "Cool Down"}))
        .toEqual("Cool Down");
    });

    test("and activity", () => {
      expect(describeRoll({activity: "Cool Down", ability: "Culture"}))
        .toEqual("Cool Down using Culture");
    });

    test.describe("as an array", () => {
      test("alone", () => {
        expect(describeRoll({activity: ["Build Up", "Cool Down"]}))
          .toEqual("Build Up or Cool Down");
      });

      test("and activity", () => {
        expect(describeRoll({activity: ["Build Up", "Cool Down"], ability: "Culture"}))
          .toEqual("Build Up or Cool Down using Culture");
      });
    });
  });

  test.describe("with ability", () => {
    test("alone", () => {
      expect(describeRoll({ability: "Culture"}))
        .toEqual("Culture");
    });

    test("and activity", () => {
      expect(describeRoll({ability: "Culture", activity: "Cool Down"}))
        .toEqual("Cool Down using Culture");
    });
  });

  test.describe("with unit", () => {
    test("and activity", () => {
      expect(describeRoll({activity: "Recruit Army", unit: "Wargs"}))
        .toEqual("Recruit Army for Wargs");
    });

    test("and activity and ability", () => {
      expect(describeRoll({activity: "Recruit Army", ability: "Stability", unit: "Wargs"}))
        .toEqual("Recruit Army for Wargs using Stability");
    });
  });

  test.describe("with structure", () => {
    test("and activity", () => {
      expect(describeRoll({activity: "Build Structure", structure: "Taco Bell"}))
        .toEqual("Build Structure for Taco Bell");
    });

    test("and activity and ability", () => {
      expect(describeRoll({activity: "Build Structure", ability: "Culture", structure: "Taco Bell"}))
        .toEqual("Build Structure for Taco Bell using Culture");
    });
  });
});
