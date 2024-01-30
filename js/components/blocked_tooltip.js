export function blockedTooltip(blockReason, content) {
  if (!blockReason) { return content }

  if (content.outerHTML || content.html) { // got a DOM object or a part; return a DOM object
    return Maker.tag("sl-tooltip", {content: `🚫 ${blockReason}`}, content);
  } else { // got a string; return a string
    return blockedTooltip(blockReason, {html: content}).outerHTML;
  }
}
