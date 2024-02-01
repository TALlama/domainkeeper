export function humanize(name) {
  return name.replace(/^([a-z])/, s => s.toUpperCase()).replace(/([a-z])([A-Z])/g, "$1 $2");
}
