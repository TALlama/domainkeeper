const { test, expect } = require('@playwright/test');
const { Powerup } = require("../../js/models/powerup");

class ColorPowerup extends Powerup {
  setup() { this.l = 0.2126*this.r + 0.7152*this.g + 0.0722*this.b; }
  added() { this.pl = 0.299*this.r + 0.587*this.g + 0.114*this.b; }

  get rgb() { return `rgb(${this.r}, ${this.g}, ${this.b})` }

  static get templates() {
    return [{name: "red", r: 255, g: 0, b: 0}, {name: "green", r: 0, g: 255, b: 0}, {name: "blue", r: 0, g: 0, b: 255}];
  }
}

test.describe("creation", makeSure => {
  test("sets its name", () => expect(new Powerup("red").name).toEqual("red"));
  test("sets its template", () => expect(new Powerup("red").template).toEqual("red"));

  test("sets its name, which can differ from the template", () => expect(new Powerup({name: "Danger", template: "red"}).name).toEqual("Danger"));
  test("sets its template, which can differ from the name", () => expect(new Powerup({name: "Danger", template: "red"}).template).toEqual("red"));

  test("auto-generates an id", () => expect(new Powerup("red").id).toBeDefined());
  test("always has traits", () => expect(new Powerup("red").traits).toEqual([]));

  test("finds the named template", () => expect(new ColorPowerup("red").rgb).toEqual("rgb(255, 0, 0)"));
  test("finds its property-named template", () => expect(new ColorPowerup({name: "red"}).rgb).toEqual("rgb(255, 0, 0)"));
  test("finds its name-overridden template", () => expect(new ColorPowerup({name: "Danger", template: "red"}).rgb).toEqual("rgb(255, 0, 0)"));
});

test.describe("trait management", makeSure => {
  test("can add traits", () => {
    const powerup = new Powerup("Cool");
    expect(powerup.traits).toEqual([]);
    powerup.addTrait("Cold");
    expect(powerup.traits).toEqual(["Cold"]);
    powerup.addTrait("Cold"); // won't add something that's already there
    expect(powerup.traits).toEqual(["Cold"]);
  });

  test("can remove traits", () => {
    const powerup = new Powerup("Cool");
    powerup.traits = ["Cold", "Frigid"];
    powerup.removeTrait("Cold");
    expect(powerup.traits).toEqual(["Frigid"]);
    powerup.removeTrait("Cold");
    expect(powerup.traits).toEqual(["Frigid"]);
  });
});

test.describe(".add will handle the lifecycle events", makeSure => {
  function makeActor() {
    let powerups = [];
    return {addPowerup(p) { powerups.push(p) }, powerups}
  };

  test("adds to the actor", () => {
    let actor = makeActor();
    let powerup = ColorPowerup.add({type: ColorPowerup, template: "red", actor});
    expect(actor.powerups).toEqual([powerup]);
  });

  test("calls my setup method, then the class setup method, before adding to the actor", () => {
    let actor = makeActor();
    let returned = ColorPowerup.add({type: ColorPowerup, template: "red", actor, setup: ({powerup}) => {
      expect(actor.powerups).toEqual([]);
      expect(powerup.l).toEqual(undefined);
      powerup.calledSetup = true;
    }});

    expect(returned.l).toEqual(54.213);
    expect(returned.calledSetup).toEqual(true);
  });

  test("calls my added method, then the class added method, after adding to the actor", () => {
    let actor = makeActor();
    let returned = ColorPowerup.add({type: ColorPowerup, template: "red", actor, added: ({powerup}) => {
      expect(actor.powerups).toEqual([powerup]);
      expect(powerup.l).toBeDefined(); // setup has already been called
      expect(powerup.pl).toEqual(undefined);
      powerup.calledAdded = true;
    }});

    expect(returned.pl).toEqual(76.24499999999999);
    expect(returned.calledAdded).toEqual(true);
  });
});
