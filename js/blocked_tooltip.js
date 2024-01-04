export function blockedTooltip(blockReason, html) {
  return blockReason ? `<sl-tooltip content="🚫 ${blockReason}">${html.outerHTML || html}</sl-tooltip>` : html
}
