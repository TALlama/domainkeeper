class Maker {
  static tag(tagName, ...parts) {
    let el = tagName.tagName ? tagName : document.createElement(tagName);
    
    parts.forEach(part => {
      if (part === null || part === undefined) {
        // ignore
      } else if ("string boolean number".split(' ').includes(typeof part) || part.tagName) {
        el.append(part);
      } else if (Array.isArray(part)) {
        Maker.tag(el, ...part);
      } else if ("function" === typeof part) {
        Maker.tag(el, part.call(el, el));
      } else {
        Maker.setAttributes(el, part);
      }
    })
    
    return el;
  }

  static setAttributes(el, attributes) {
    for (let [name, value] of Object.entries(attributes || {})) {
      if (value !== null && value !== undefined) {
        if (name == "prependTo") { value.prepend(el); continue; }
        if (name == "appendTo") { value.append(el); continue; }
        if (name == "rx") { reef.component(el, value); continue; }
        if (name == "click") { el.addEventListener(name, value); continue; }
        if (name == "class") { value = [el.className, value].join(' ').trim() }
        
        el.setAttribute(name, value);
      }
    }
    return el;
  }

  static p(...parts) { return Maker.tag("p", ...parts) }
  static ul(...items) { return Maker.tag("ul", items.map(i => Maker.tag("li", i))) }
  static ol(...items) { return Maker.tag("ol", items.map(i => Maker.tag("li", i))) }

  static dl(dictionary, ...parts) {
    return Maker.tag("dl",
      Object.entries(dictionary).flatMap((key_value, index) => {
        let [key, value] = key_value;
        return [Maker.tag("dt", key), Maker.tag("dd", value)]
      }),
      ...parts,
    );
  }
}
