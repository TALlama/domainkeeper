export function withTraits(toClass) {
  Object.assign(toClass.prototype, {
    matchingTraits(...names) { return names.filter(name => (this.traits || []).includes(name)) },
    hasTrait(...names) { return this.matchingTraits(...names).length > 0 },
    hasAllTraits(...names) { return this.matchingTraits(...names).length === names.length },

    addTrait(name, opts = {}) {
      this.hasTrait(name) || this.traits.push(name)
      this.traitsChanged({...opts, added: name});
    },
    removeTrait(name, opts = {}) {
      let ix = this.traits.indexOf(name);
      if (ix > -1) {
        this.traits.splice(ix, 1);
        this.traitsChanged({...opts, removed: name});
      }
    },
  });

  toClass.prototype.traitsChanged ??= function traitsChanged({added, removed, activity}) { };
}
