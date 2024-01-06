export class PickableGroup {
  constructor({name, options, option, parts}) {
    this.name = name ?? crypto.randomUUID();
    this.options = options ?? [];
    this.option = option ?? ((value, optParts, html) => html);
    this.parts = parts || [];
  }

  render() {
    return Maker.tag("fieldset", {class: "pickable-group"},
      Object.keys(this.options).map(value =>
        this.option(
          value,
          this.options[value],
          Maker.tag("label", {class: "pickable btn"},
            Maker.tag("input", {class: "sr-only", type: "radio", value, name: this.name}),
            this.options[value],
          ),
        )
      ),
      ...this.parts,
    );
  }
}
