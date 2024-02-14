export function addTransient(obj, {name, value, ...options} = {}) {
  let storage = value ?? {};
  Object.defineProperty(obj, name ?? "transient", {
    get() { return storage },
    set(value) { storage = value },
    ...options,
  });
  return storage;
};

export function hydrateList(obj, {name, type, keepOrMake, make, keep, ...options} = {}) {
  keep ??= (item) => item?.constructor === type;
  make ??= (...args) => new type(...args);
  keepOrMake ??= (item) => keep(item) ? item : make(item, obj)

  Object.defineProperty(obj, name, {enumerable: true,
    get() { return obj.transient[name] },
    set(value) { this.transient[name] = value.map(keepOrMake) },
  });

  return obj[name] ??= [];
}
