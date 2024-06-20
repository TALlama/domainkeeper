const { test, expect } = require('@playwright/test');

const { mod, describeRoll } = require('../js/helpers');

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
