import { Eris } from "../eris.js";
import { blockedTooltip } from "./blocked_tooltip.js";

Eris.test("blockedTooltip", fn => {
  fn.it("given html, returns html", ({assert}) =>
    assert.equals(blockedTooltip("block", `stuff`), `<sl-tooltip content="🚫 block">stuff</sl-tooltip>`)
  );
  fn.it("given DOM objects, returns DOM objects", ({assert}) =>
    assert.equals(blockedTooltip("block", Maker.tag("div")).outerHTML, `<sl-tooltip content="🚫 block"><div></div></sl-tooltip>`)
  );
});
