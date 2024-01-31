import { Eris } from "../eris.js";
import { Powerup } from "./powerup.js";

Eris.test("Powerups", makeSure => {
  class ColorPowerup extends Powerup {
    setup() { this.l = 0.2126*this.r + 0.7152*this.g + 0.0722*this.b; }
    added() { this.pl = 0.299*this.r + 0.587*this.g + 0.114*this.b; }

    get rgb() { return `rgb(${this.r}, ${this.g}, ${this.b})` }

    static get templates() {
      return [{name: "red", r: 255, g: 0, b: 0}, {name: "green", r: 0, g: 255, b: 0}, {name: "blue", r: 0, g: 0, b: 255}];
    }
  }

  makeSure.describe("creation", makeSure => {
    makeSure.it("sets its name", ({assert}) => assert.equals(new Powerup("red").name, "red"));
    makeSure.it("sets its template", ({assert}) => assert.equals(new Powerup("red").template, "red"));

    makeSure.it("sets its name", ({assert}) => assert.equals(new Powerup({name: "Danger", template: "red"}).name, "Danger"));
    makeSure.it("sets its template", ({assert}) => assert.equals(new Powerup({name: "Danger", template: "red"}).template, "red"));

    makeSure.it("auto-generates an id", ({assert}) => assert.defined(new Powerup("red").id));
    makeSure.it("always has traits", ({assert}) => assert.equals(new Powerup("red").traits, []));

    makeSure.it("finds the named template", ({assert}) => assert.equals(new ColorPowerup("red").rgb, "rgb(255, 0, 0)"));
    makeSure.it("finds its property-named template", ({assert}) => assert.equals(new ColorPowerup({name: "red"}).rgb, "rgb(255, 0, 0)"));
    makeSure.it("finds its name-overridden template", ({assert}) => assert.equals(new ColorPowerup({name: "Danger", template: "red"}).rgb, "rgb(255, 0, 0)"));
  });

  makeSure.describe("trait management", makeSure => {
    makeSure.let("powerup", () => new Powerup("Cool"));

    makeSure.it("can add traits", ({assert, powerup}) => {
      assert.equals(powerup.traits, []);
      powerup.addTrait("Cold");
      assert.equals(powerup.traits, ["Cold"]);
      powerup.addTrait("Cold"); // won't add something that's already there
      assert.equals(powerup.traits, ["Cold"]);
    });

    makeSure.it("can remove traits", ({assert, powerup}) => {
      powerup.traits = ["Cold", "Frigid"];
      powerup.removeTrait("Cold");
      assert.equals(powerup.traits, ["Frigid"]);
      powerup.removeTrait("Cold");
      assert.equals(powerup.traits, ["Frigid"]);
    });
  });

  makeSure.describe(".add will handle the lifecycle events", makeSure => {
    makeSure.let("actor", () => { return {powerups: []} });

    makeSure.it("adds to the actor", ({assert, actor}) => {
      let powerup = ColorPowerup.add({type: ColorPowerup, template: "red", actor});
      assert.equals(actor.powerups, [powerup]);
    });
    makeSure.it("calls my setup method, then the class setup method, before adding to the actor", ({assert, actor}) => {
      let returned = ColorPowerup.add({type: ColorPowerup, template: "red", actor, setup: ({powerup}) => {
        assert.equals(actor.powerups, []);
        assert.equals(powerup.l, undefined);
        powerup.calledSetup = true;
      }});

      assert.equals(returned.l, 54.213);
      assert.equals(returned.calledSetup, true);
    });
    makeSure.it("calls my added method, then the class added method, after adding to the actor", ({assert, actor}) => {
      let returned = ColorPowerup.add({type: ColorPowerup, template: "red", actor, added: ({powerup}) => {
        assert.equals(actor.powerups, [powerup]);
        assert.defined(powerup.l); // setup has already been called
        assert.equals(powerup.pl, undefined);
        powerup.calledAdded = true;
      }});

      assert.equals(returned.pl, 76.24499999999999);
      assert.equals(returned.calledAdded, true);
    });
  });
});