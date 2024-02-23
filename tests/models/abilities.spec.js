const { test, expect } = require('@playwright/test');

const { Ability } = require('../../js/models/abilities');

test("Ability knows the ability list", () =>
  expect(["Culture", "Economy", "Loyalty", "Stability"]).toEqual(Ability.all)
);

test("Ability knows the previous ability", () => {
  expect(Ability.previous("Culture")).toEqual("Stability");
  expect(Ability.previous("Economy")).toEqual("Culture");
  expect(Ability.previous("Loyalty")).toEqual("Economy");
  expect(Ability.previous("Stability")).toEqual("Loyalty");
});

test("Ability knows the next ability", () => {
  expect(Ability.next("Culture")).toEqual("Economy");
  expect(Ability.next("Economy")).toEqual("Loyalty");
  expect(Ability.next("Loyalty")).toEqual("Stability");
  expect(Ability.next("Stability")).toEqual("Culture");
});

test("Ability can get a random ability", () => {
  expect(Ability.all).toContain(Ability.random);
  expect(Ability.all).toContain(Ability.random);
  expect(Ability.all).toContain(Ability.random);
});
