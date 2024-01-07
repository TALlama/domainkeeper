import { Eris } from "../eris.js";

export function blockedTooltip(blockReason, content) {
  if (!blockReason) { return content }

  if (content.outerHTML || content.html) { // got a DOM object or a part; return a DOM object
    return Maker.tag("sl-tooltip", {content: `🚫 ${blockReason}`}, content);
  } else { // got a string; return a string
    return blockedTooltip(blockReason, {html: content}).outerHTML;
  }
}

Eris.test("blockedTooltip", fn => {
  fn.it("given html, returns html", ({assert}) =>
    assert.equals(blockedTooltip("block", `stuff`), `<sl-tooltip content="🚫 block">stuff</sl-tooltip>`)
  );
  fn.it("given DOM objects, returns DOM objects", ({assert}) =>
    assert.equals(blockedTooltip("block", Maker.tag("div")).outerHTML, `<sl-tooltip content="🚫 block"><div></div></sl-tooltip>`)
  );
});
