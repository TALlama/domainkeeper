import { Eris } from "../eris.js";
import { Ability } from "./abilities.js";

Eris.test("Ability", makeSure => {
  makeSure.it("knows the ability list", ({assert}) =>
    assert.equals(["Culture", "Economy", "Loyalty", "Stability"], Ability.all)
  );
  makeSure.it("knows the previous ability", ({assert}) => {
    assert.equals(Ability.previous("Culture"), "Stability");
    assert.equals(Ability.previous("Economy"), "Culture");
    assert.equals(Ability.previous("Loyalty"), "Economy");
    assert.equals(Ability.previous("Stability"), "Loyalty");
  });
  makeSure.it("knows the next ability", ({assert}) => {
    assert.equals(Ability.next("Culture"), "Economy");
    assert.equals(Ability.next("Economy"), "Loyalty");
    assert.equals(Ability.next("Loyalty"), "Stability");
    assert.equals(Ability.next("Stability"), "Culture");
  });
  makeSure.it("can get a random ability", ({assert}) => {
    assert.includedIn(Ability.random, Ability.all);
    assert.includedIn(Ability.random, Ability.all);
    assert.includedIn(Ability.random, Ability.all);
  });
})
