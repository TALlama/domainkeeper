import { Eris } from "../eris.js";
import { withTraits } from "./with_traits.js";

Eris.test("withTraits", makeSure => {
  class TraitBox { constructor(...traits) { this.traits = traits} }
  withTraits(TraitBox);

  makeSure.describe("hasTrait", makeSure => {
    makeSure.it("knows if you have a trait", ({assert}) => assert.true(new TraitBox("Good").hasTrait("Good")));
    makeSure.it("knows if you don't have a trait", ({assert}) => assert.false(new TraitBox("Good").hasTrait("Bad")));

    makeSure.describe("with multiple arguments", makeSure => {
      makeSure.it("knows if you have any of the given traits", ({assert}) => {
        assert.true(new TraitBox("Good").hasTrait("Good", "Bad"));
        assert.true(new TraitBox("Bad").hasTrait("Good", "Bad"));
        assert.true(new TraitBox("Good").hasTrait("Good", "Plenty"));
      });
      makeSure.it("knows if you don't have any of the given traits", ({assert}) =>
        assert.false(new TraitBox("Good").hasTrait("Horrible", "No Good", "Very Bad")),
      );
    });

    makeSure.describe("can tell if you have all the traits", makeSure => {
      let alexandersDay = new TraitBox("Horrible", "No Good", "Very Bad");

      makeSure.it("knows if you have any of the given traits", ({assert}) => {
        assert.true(alexandersDay.hasAllTraits("Horrible"));
        assert.true(alexandersDay.hasAllTraits("Horrible", "No Good"));
        assert.true(alexandersDay.hasAllTraits("Horrible", "No Good", "Very Bad"));
        assert.true(alexandersDay.hasAllTraits("No Good", "Horrible"));
      });
      makeSure.it("knows if you don't have any of the given traits", ({assert}) => {
        assert.false(alexandersDay.hasAllTraits("Good"));
        assert.false(alexandersDay.hasAllTraits("Horrible", "No Good", "Only Kinda Bad"));
      });
    });
  });

  makeSure.describe("addTrait", makeSure => {
    makeSure.let("box", () => new TraitBox("Good"));

    makeSure.it("will add traits", ({assert, box}) => {
      box.addTrait("Bad");
      assert.equals(box.traits, ["Good", "Bad"]);
    });

    makeSure.it("will not add duplicate traits", ({assert, box}) => {
      box.addTrait("Good");
      assert.equals(box.traits, ["Good"]);
    });
  });


  makeSure.describe("removeTrait", makeSure => {
    makeSure.let("box", () => new TraitBox("Good", "Bad"));

    makeSure.it("will remove traits", ({assert, box}) => {
      box.removeTrait("Bad");
      assert.equals(box.traits, ["Good"]);
    });

    makeSure.it("will ignore requests to remove stuff that's not there", ({assert, box}) => {
      box.removeTrait("Ugly");
      assert.equals(box.traits, ["Good", "Bad"]);
    });
  });
});
