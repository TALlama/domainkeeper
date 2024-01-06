export class Ability {
  static all = "Culture Economy Loyalty Stability".split(" ");

  static previous(from) { return {Stability: "Loyalty", Loyalty: "Economy", Economy: "Culture", Culture: "Stability"}[from] }
  static next(from) { return {Culture: "Economy", Economy: "Loyalty", Loyalty: "Stability", Stability: "Culture"}[from] }
  static get random() { return this.all.random() }
}

import {Eris} from "./eris.js";
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
