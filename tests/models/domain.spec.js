const { test, expect } = require('@playwright/test');

const { Domain } = require('../../js/models/domain');

let roundtrip = (o) => JSON.parse(JSON.stringify(o));

test("Defaults", () => {
  const domain = new Domain({});
  const roundtripped = roundtrip(domain);

  expect.soft(roundtripped.name, "default name").toEqual("Anvilania");

  expect.soft(roundtripped.culture, "default culture").toEqual(2);
  expect.soft(roundtripped.economy, "default economy").toEqual(2);
  expect.soft(roundtripped.loyalty, "default loyalty").toEqual(2);
  expect.soft(roundtripped.stability, "default stability").toEqual(2);
  
  expect.soft(roundtripped.unrest, "default unrest").toEqual(0);
  expect.soft(roundtripped.size, "default size").toEqual(1);
  expect.soft(roundtripped.level, "default level").toEqual(1);
  expect.soft(roundtripped.xp, "default xp").toEqual(0);

  expect.soft(roundtripped.milestones, "default milestones").toEqual({});
  expect.soft(roundtripped.consumables, "default consumables").toEqual([]);
  
  expect.soft(roundtripped.settlements.map(s => s.name), "default settlements").toEqual(["Capital"]);
  expect.soft(roundtripped.leaders.map(s => s.name), "default leaders").toEqual([]);
  expect.soft(roundtripped.turns.map(s => s.number), "default turns").toEqual([0]);
  expect.soft(roundtripped.turns.map(s => s.name), "default turns").toEqual(["Domain Creation"]);

  expect.soft(Object.keys(roundtripped).sort(), "all keys").toEqual([
    "name",
    "culture",
    "economy",
    "feats",
    "loyalty",
    "stability",
    "unrest",
    "size",
    "level",
    "xp",
    "milestones",
    "consumables",
    "settlements",
    "leaders",
    "turns",
  ].sort());
});

test.describe("Stats", () => {
  test("Have minimums", () => {
    const domain = new Domain({});
    expect.soft(domain.min("level")).toEqual(1);
    expect.soft(domain.min("size")).toEqual(1);
    expect.soft(domain.min("anything else")).toEqual(0);
  });

  test.describe("Have maximums", () => {
    test("with a base max", () => {
      const domain = new Domain({});

      expect.soft(domain.max("culture")).toEqual(5);
      expect.soft(domain.max("economy")).toEqual(5);
      expect.soft(domain.max("stability")).toEqual(5);
      expect.soft(domain.max("loyalty")).toEqual(5);

      expect.soft(domain.max("unrest")).toEqual(20);
      expect.soft(domain.max("level")).toEqual(20);

      expect.soft(domain.max("size")).toEqual(200);

      expect.soft(domain.max("anything else")).toEqual(99999);
    });

    test("max can be increased by powerups' bonuses", () => {
      const domain = new Domain({});
      const capital = domain.settlements[0];
      capital.addPowerup({bonuses: [{max: "culture", value: 2}]});
      expect.soft(domain.max("culture")).toEqual(7);
      capital.addPowerup({bonuses: [{max: "culture", value: 3}]});
      expect.soft(domain.max("culture")).toEqual(10);
    });
  });

  test.describe("Can be modified", () => {
    test.describe("Up", () => {
      test("Below the maximum", () => {
        const domain = new Domain({});
        domain.modify({by: 1}, ["culture"]);
        expect.soft(domain.culture).toEqual(3);
        domain.modify({by: 2}, ["Culture"]);
        expect.soft(domain.culture).toEqual(5);
      });

      test("Above the maximum", () => {
        const domain = new Domain({});
        domain.modify({by: 4}, ["culture"]);
        expect.soft(domain.culture).toEqual(5);
        expect.soft(domain.xp).toEqual(50);
      });
    });

    test.describe("Down", () => {
      test("Above the minimum", () => {
        const domain = new Domain({});
        domain.modify({by: -1}, ["culture"]);
        expect.soft(domain.culture).toEqual(1);
      });

      test("Below the minimum", () => {
        const domain = new Domain({});
        domain.modify({by: -3}, ["culture"]);
        expect.soft(domain.culture).toEqual(0);
        expect.soft(domain.xp).toEqual(0);
      });
    });
  })
});

test.describe("Markers", () => {
  test("Shows the settlements that have positions", () => {
    expect(new Domain({}).markers).toEqual([]);
    expect(new Domain({settlements: [
      {icon: "1️⃣", position: [11, 11]},
      {icon: "2️⃣", position: [22, 22]},
    ]}).markers).toEqual([
      {editable: false, icon: "1️⃣", position: [11, 11]},
      {editable: false, icon: "2️⃣", position: [22, 22]},
    ]);
  })
});

test.describe("Milestones", () => {
  test("By default, no milestones have been met", () => {
    const domain = new Domain({});
    expect(domain.milestones).toEqual({});
  });

  test("Milestones, once set, are preserved", () => {
    const domain = new Domain({});
    domain.milestones["Pet the dog"] = true;
    expect(roundtrip(domain).milestones["Pet the dog"]).toBe(true);
  });
});
