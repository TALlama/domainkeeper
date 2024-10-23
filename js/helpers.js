import "./extensions.js";
import { Requirement } from "./models/requirement.js";

export function prettyJSON(value) { return JSON.stringify(value, (key, value) => key[0] === "_" ? undefined : value, 2) }
export function debugJSON(value) { return `<code class="debug"><pre>${prettyJSON(value)?.escapeHtml()}</pre></code>` }

export function mod(value) { return value < 0 ? value.toString() : `+${value}` }
export function displayBonus(bonus) {
  if (bonus.type === "unlock") {
    return `🔒 Unlock activity: ${describeRoll(bonus)}`;
  } else if (bonus.type === "reductionProtection") {
    return `🛡️ DC${bonus.value || 11} Protection of ${bonus.ability}`;
  } else if (bonus.activity) {
    return `⏩ ${mod(bonus.value || 0)} to ${describeRoll(bonus)}`;
  } else if (bonus.max) {
    return `${bonus.value > 0 ? "⬆️" : "⬇️"} ${mod(bonus.value)} to maximum ${bonus.max}`;
  } else {
    return bonus.description || errorMessage(`UNKNOWN BONUS ${debugJSON(bonus)}`, bonus);
  }
}

export function displayRequirement(domain, req) {
  let requirement = Requirement.evaluate(domain, req);
  return `<span class="requirement ${requirement.met ? "met" : "unmet"}">${requirement.description}</span>`;
}

export function describeRoll({activity, ability, unit, structure}) {
  let parts = [
    activity ? (Array.isArray(activity) ? activity.join(" or ") : activity) : null,
    unit ? `for ${unit}` : null,
    structure ? `for ${structure}` : null,
    (ability && activity) ? `using` : null,
    ability ? ability : null,
  ].filter(Boolean);
  
  return parts.length ? parts.join(" ") : "any check";
}

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
