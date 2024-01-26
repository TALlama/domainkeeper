export function withTemplates(toClass, make) {
  Object.defineProperty(toClass, "templates", {
    get() { return this._templates ??= make() },
    set(v) { this._templates = v },
  })

  toClass.template = function(name) { return this.templates.find(t => t.name === name) || {} };

  Object.assign(toClass.prototype, {
    init(properties, defaults = {}) {
      let [templateName, props] = ("string" === typeof properties) ? [properties, {}] : [properties.templateName || properties.name, properties];
      let fallbacks = props.fallbacks;
      delete props.fallbacks;

      Object.assign(this, {
        ...fallbacks,
        ...defaults,
        ...this.constructor.template(templateName),
        ...props});

      this.name ||= templateName;
      this.templateName ||= templateName;

      return {templateName, props};
    }
  });
}
