import { Eris } from "../eris.js";
import { addTransient } from "./utils.js";

Eris.test("addTransient", makeSure => {
  makeSure.it("can add properties to an object that aren't reflected in its JSON output", ({assert}) => {
    let obj = {num: 1, arr: [1, 2, 3]};
    assert.jsonEquals(obj, {num: 1, arr: [1, 2, 3]});

    addTransient(obj, {name: "color"});
    obj.color = "red";
    assert.jsonEquals(obj, {num: 1, arr: [1, 2, 3]});
  });
});
