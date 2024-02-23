const { test, expect } = require('@playwright/test');
const { withTraits } = require("../../js/models/with_traits");

class TraitBox { constructor(...traits) { this.traits = traits} }
withTraits(TraitBox);

test.describe("hasTrait", () => {
  test("knows if you have a trait", () => expect(new TraitBox("Good").hasTrait("Good")).toBe(true));
  test("knows if you don't have a trait", () => expect(new TraitBox("Good").hasTrait("Bad")).toBe(false));

  test.describe("with multiple arguments", () => {
    test("knows if you have any of the given traits", () => {
      expect(new TraitBox("Good").hasTrait("Good", "Bad")).toBe(true);
      expect(new TraitBox("Bad").hasTrait("Good", "Bad")).toBe(true);
      expect(new TraitBox("Good").hasTrait("Good", "Plenty")).toBe(true);
    });
    test("knows if you don't have any of the given traits", () =>
      expect(new TraitBox("Good").hasTrait("Horrible", "No Good", "Very Bad")).toBe(false),
    );
  });

  test.describe("can tell if you have all the traits", () => {
    let alexandersDay = new TraitBox("Horrible", "No Good", "Very Bad");

    test("knows if you have any of the given traits", () => {
      expect(alexandersDay.hasAllTraits("Horrible")).toBe(true);
      expect(alexandersDay.hasAllTraits("Horrible", "No Good")).toBe(true);
      expect(alexandersDay.hasAllTraits("Horrible", "No Good", "Very Bad")).toBe(true);
      expect(alexandersDay.hasAllTraits("No Good", "Horrible")).toBe(true);
    });
    test("knows if you don't have any of the given traits", () => {
      expect(alexandersDay.hasAllTraits("Good")).toBe(false);
      expect(alexandersDay.hasAllTraits("Horrible", "No Good", "Only Kinda Bad")).toBe(false);
    });
  });
});

test.describe("addTrait", () => {
  test("will add traits", () => {
    const box = new TraitBox("Good");
    box.addTrait("Bad");
    expect(box.traits).toEqual(["Good", "Bad"]);
  });

  test("will not add duplicate traits", () => {
    const box = new TraitBox("Good");
    box.addTrait("Good");
    expect(box.traits).toEqual(["Good"]);
  });
});


test.describe("removeTrait", () => {
  test("will remove traits", () => {
    const box = new TraitBox("Good", "Bad");
    box.removeTrait("Bad");
    expect(box.traits).toEqual(["Good"]);
  });

  test("will ignore requests to remove stuff that's not there", () => {
    const box = new TraitBox("Good", "Bad");
    box.removeTrait("Ugly");
    expect(box.traits).toEqual(["Good", "Bad"]);
  });
});
