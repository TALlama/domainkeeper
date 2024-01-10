import "./extensions.js";

export function prettyJSON(value) { return JSON.stringify(value, (key, value) => key[0] === "_" ? undefined : value, 2) }
export function debugJSON(value) { return `<code class="debug"><pre>${prettyJSON(value)?.escapeHtml()}</pre></code>` }

export function mod(value) { return value < 0 ? value.toString() : `+${value}` }

export function taggedLi(tag, ...parts) { return Maker.tag("li", Maker.tag("strong", `${tag} `), ...parts).outerHTML }
taggedLi.requirements = (...parts) => taggedLi("Requirements", ...parts);
taggedLi.special = (...parts) => taggedLi("Special", ...parts);

export function errorMessage(msg, ...consoleArgs) {
  console.error(msg, ...consoleArgs);
  return `<span class="internal-error">💥 ERROR: ${msg} 💥</span>`;
}

// TODO add tests
export function withDiffs(newValues, baseline) {
  if (!baseline) { return newValues }

  let retval = {};
  Object.keys(newValues).forEach((ability) => {
    let value = newValues[ability];
    let diff = value - baseline[ability];
    let signClass = diff > 0 ? "diff-positive" : (diff < 0 ? "diff-negative" : "diff-flat");
    retval[ability] = [value, Maker.tag("span", {class: `metadata diff ${signClass}`}, `${diff >= 0 ? "+" : ""}${diff}`)];
  });
  return retval;
}
