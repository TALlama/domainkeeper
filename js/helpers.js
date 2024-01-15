import "./extensions.js";

export function prettyJSON(value) { return JSON.stringify(value, (key, value) => key[0] === "_" ? undefined : value, 2) }
export function debugJSON(value) { return `<code class="debug"><pre>${prettyJSON(value)?.escapeHtml()}</pre></code>` }

export function mod(value) { return value < 0 ? value.toString() : `+${value}` }
export function displayBonus(bonus) {
  if (bonus.activity) {
    return `⏩ ${mod(bonus.value)} to ${bonus.activity} using ${bonus.ability || "any ability"}`;
  } else if (bonus.max) {
    return `${bonus.value > 0 ? "⬆️" : "⬇️"} ${mod(bonus.value)} to maximum ${bonus.max}`;
  } else if (bonus.unlock) {
    return `🔒 Unlock ability: ${bonus.unlock}`;
  } else {
    return bonus.description || errorMessage(`UNKNOWN BONUS ${debugJSON(bonus)}`, bonus);
  }
}

export function taggedLi(tag, ...parts) { return Maker.tag("li", Maker.tag("strong", `${tag} `), ...parts).outerHTML }
taggedLi.requirements = (...parts) => taggedLi("Requirements", ...parts);
taggedLi.special = (...parts) => taggedLi("Special", ...parts);

export function errorMessage(msg, ...consoleArgs) {
  console.error(msg, ...consoleArgs);
  return `<span class="internal-error">💥 ERROR: ${msg} 💥</span>`;
}

export function callOrReturn(value, bindTo, ...args) {
  return value?.call ? value.call(bindTo, ...args) : value;
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
