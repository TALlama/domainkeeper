import { Eris } from "./eris.js";

Eris.test("Maker", maker => {
  maker.letElement("attached", () => Maker.tag("div", {class: "debug", appendTo: document.body}));

  maker.describe("tags", fn => {
    fn.it("makes tags, adds content", ({assert}) =>
      assert.equals(Maker.tag("div", "content").outerHTML, `<div>content</div>`)
    );
  });

  maker.describe("attributes", fn => {
    fn.it("sets attributes", ({assert}) =>
      assert.equals(Maker.tag("input", {type: "number"}).outerHTML, `<input type="number">`)
    );
  });

  maker.describe("content", fn => {
    fn.it("can be given as strings", ({assert}) => assert.equals(Maker.tag("div", "one").outerHTML, `<div>one</div>`))
    fn.it("can be given as integers", ({assert}) => assert.equals(Maker.tag("div", 1).outerHTML, `<div>1</div>`))
    fn.it("can be given as floats", ({assert}) => assert.equals(Maker.tag("div", 1.3).outerHTML, `<div>1.3</div>`))
    fn.it("can be given as boolean true", ({assert}) => assert.equals(Maker.tag("div", true).outerHTML, `<div>true</div>`))
    fn.it("can be given as boolean false", ({assert}) => assert.equals(Maker.tag("div", false).outerHTML, `<div>false</div>`))
    fn.it("can be given as objects with a render() function", ({assert}) => assert.equals(Maker.tag("div", {render: () => "howdy"}).outerHTML, `<div>howdy</div>`))
    fn.it("can be given as arrays containing whatever", ({assert}) =>
      assert.equals(Maker.tag("div", ["one", 1, 1.3, true, false]).outerHTML, `<div>one11.3truefalse</div>`)
    );
    fn.it("can be given as functions returning whatever", ({assert}) =>
      assert.equals(Maker.tag("div", () => "hey").outerHTML, `<div>hey</div>`)
    );
  });

  maker.describe("special attributes", fn => {
    fn.it("class compounds", ({assert}) =>
      assert.equals(Maker.tag("div", {class: "foo"}, {class: "bar sna"}).outerHTML, `<div class="foo bar sna"></div>`)
    );

    //content
    fn.it("html adds raw", ({assert}) => {
      assert.equals(Maker.tag("div", "Oh ", {html: `<strong>Hey</strong>`}, " there!").outerHTML, `<div>Oh <strong>Hey</strong> there!</div>`);
    });

    // connecting to other nodes
    fn.it("appendTo adds it to another relement", ({assert}) => {
      let root = Maker.tag("main", Maker.tag("header", "stuff:"));
      Maker.tag("div", "content", {appendTo: root});
      assert.equals(root.outerHTML, `<main><header>stuff:</header><div>content</div></main>`);
    });
    fn.it("prependTo adds it to another relement", ({assert}) => {
      let root = Maker.tag("main", Maker.tag("footer", "that's all the stuff!"));
      Maker.tag("div", "content", {prependTo: root});
      assert.equals(root.outerHTML, `<main><div>content</div><footer>that's all the stuff!</footer></main>`);
    });

    //events
    fn.it("click adds a handler", ({assert}) => {
      let count = 0;
      let el = Maker.tag("div", {click: () => ++count});
      el.click();

      assert.equals(count, 1);
    });
    fn.it("change adds a handler", ({assert}) => {
      let count = 0;
      let el = Maker.tag("label", {appendTo: maker.attached, change: () => ++count}, Maker.tag("input", {type: "radio"}));
      el.click();

      assert.equals(count, 1);
    });
  });
});
