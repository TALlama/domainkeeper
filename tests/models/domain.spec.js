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
    "features",
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
    "traits",
  ].sort());
});

test.describe("Bonuses", () => {
  test.describe("findBonuses", () => {
    test("has no bonuses to start", () => {
      const domain = new Domain({settlements: [{name: "Capital"}]});
      expect.soft(domain.bonuses).toEqual([]);
    });

    test("will find bonuses that apply to all checks", () => {
      const domain = new Domain({
        settlements: [{name: "Capital"}],
        feats: [{bonuses: [{value: 1}]}],
      });
      expect.soft(domain.findBonuses({})).toEqual([{value: 1, source: domain.feats[0]}]);
    });

    test("sorts bonuses with biggest first", () => {
      const domain = new Domain({
        settlements: [{name: "Capital"}],
        feats: [{bonuses: [{value: 1}, {value: 2}].shuffle()}],
      });
      expect.soft(domain.findBonuses({})).toEqual([
        {value: 2, source: domain.feats[0]},
        {value: 1, source: domain.feats[0]},
      ]);
    });

    test.describe("activity filtering", () => {
      test("no constraint on bonus", () => {
        const domain = new Domain({
          settlements: [{name: "Capital"}],
          feats: [{bonuses: [{value: 1}].shuffle()}],
        });
        expect.soft(domain.findBonuses({activity: "A"})).toEqual([
          {value: 1, source: domain.feats[0]},
        ]);
      });

      test("single value on bonus", () => {
        const domain = new Domain({
          settlements: [{name: "Capital"}],
          feats: [{bonuses: [{activity: "A", value: 1}, {activity: "B", value: 2}].shuffle()}],
        });
        expect.soft(domain.findBonuses({activity: "A"})).toEqual([
          {activity: "A", value: 1, source: domain.feats[0]},
        ]);
      });

      test("multiple values on bonus", () => {
        const domain = new Domain({
          settlements: [{name: "Capital"}],
          feats: [{bonuses: [{activity: "A", value: 1}, {activity: ["B", "C"], value: 2}].shuffle()}],
        });
        expect.soft(domain.findBonuses({activity: "B"})).toEqual([
          {activity: ["B", "C"], value: 2, source: domain.feats[0]},
        ]);
      });
    });

    test.describe("ability filtering", () => {
      test("no constraint on bonus", () => {
        const domain = new Domain({
          settlements: [{name: "Capital"}],
          feats: [{bonuses: [{value: 1}].shuffle()}],
        });
        expect.soft(domain.findBonuses({ability: "A"})).toEqual([
          {value: 1, source: domain.feats[0]},
        ]);
      });

      test("single value on bonus", () => {
        const domain = new Domain({
          settlements: [{name: "Capital"}],
          feats: [{bonuses: [{ability: "A", value: 1}, {ability: "B", value: 2}].shuffle()}],
        });
        expect.soft(domain.findBonuses({ability: "A"})).toEqual([
          {ability: "A", value: 1, source: domain.feats[0]},
        ]);
      });

      test("multiple values on bonus", () => {
        const domain = new Domain({
          settlements: [{name: "Capital"}],
          feats: [{bonuses: [{ability: "A", value: 1}, {ability: ["B", "C"], value: 2}].shuffle()}],
        });
        expect.soft(domain.findBonuses({ability: "B"})).toEqual([
          {ability: ["B", "C"], value: 2, source: domain.feats[0]},
        ]);
      });
    });

    test.describe("actorType filtering", () => {
      test("no constraint on bonus", () => {
        const domain = new Domain({
          settlements: [{name: "Capital"}],
          feats: [{bonuses: [{value: 1}].shuffle()}],
        });
        expect.soft(domain.findBonuses({actorType: "A"})).toEqual([
          {value: 1, source: domain.feats[0]},
        ]);
      });

      test("single value on bonus", () => {
        const domain = new Domain({
          settlements: [{name: "Capital"}],
          feats: [{bonuses: [{actorType: "A", value: 1}, {actorType: "B", value: 2}].shuffle()}],
        });
        expect.soft(domain.findBonuses({actorType: "A"})).toEqual([
          {actorType: "A", value: 1, source: domain.feats[0]},
        ]);
      });
    });
  });
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
        domain.modify("culture", {by: 1});
        expect.soft(domain.culture).toEqual(3);
        domain.modify("Culture", {by: 2});
        expect.soft(domain.culture).toEqual(5);
      });

      test("Above the maximum", () => {
        const domain = new Domain({});
        domain.modify("culture", {by: 4});
        expect.soft(domain.culture).toEqual(5);
        expect.soft(domain.xp).toEqual(50);
      });
    });

    test.describe("Down", () => {
      test("Above the minimum", () => {
        const domain = new Domain({});
        domain.modify("culture", {by: -1});
        expect.soft(domain.culture).toEqual(1);
      });

      test("Below the minimum", () => {
        const domain = new Domain({});
        domain.modify("culture", {by: -3});
        expect.soft(domain.culture).toEqual(0);
        expect.soft(domain.xp).toEqual(0);
      });
    });
  })
});

test.describe("Features", () => {
  test("Can tell you what features are near a spot", () => {
    let position = [50, 50];
    let [x, y] = position;
    let deltaX = 2;
    let deltaY = 5;

    expect(new Domain({}).featuresAt(position)).toEqual([]);
    expect(new Domain({features: [
      {icon: "1️⃣", position},
      {icon: "2️⃣", position: [x - deltaX, y - deltaY]},
      {icon: "3️⃣", position: [x + deltaX, y + deltaY]},
      {icon: "4️⃣", position: [x - deltaX, y + deltaY]},
      {icon: "5️⃣", position: [x + deltaX, y - deltaY]},
      {icon: "❌1", position: [x - 2 * deltaX, y - deltaY]},
      {icon: "❌2", position: [x + 2 * deltaX, y + deltaY]},
      {icon: "❌3", position: [x - 2 * deltaX, y + deltaY]},
      {icon: "❌4", position: [x + 2 * deltaX, y - deltaY]},
      {icon: "❌5", position: [x - deltaX, y - 2 * deltaY]},
      {icon: "❌6", position: [x + deltaX, y + 2 * deltaY]},
      {icon: "❌7", position: [x - deltaX, y + 2 * deltaY]},
      {icon: "❌8", position: [x + deltaX, y - 2 * deltaY]},
      {icon: "❌9"},
    ]}).featuresAt(position).map(f => {return {icon: f.icon, position: f.position}})).toEqual([
      {icon: "1️⃣", position},
      {icon: "2️⃣", position: [x - deltaX, y - deltaY]},
      {icon: "3️⃣", position: [x + deltaX, y + deltaY]},
      {icon: "4️⃣", position: [x - deltaX, y + deltaY]},
      {icon: "5️⃣", position: [x + deltaX, y - deltaY]},
    ]);
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
  });

  test("Shows the features that have positions", () => {
    expect(new Domain({}).markers).toEqual([]);
    expect(new Domain({features: [
      {icon: "1️⃣", position: [11, 11]},
      {icon: "2️⃣", position: [22, 22]},
    ]}).markers).toEqual([
      {editable: false, icon: "1️⃣", position: [11, 11]},
      {editable: false, icon: "2️⃣", position: [22, 22]},
    ]);
  });
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
