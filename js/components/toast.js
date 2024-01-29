export function escapeHtml(html) {
  return Object.assign(document.createElement('div'), {textContent: html}).innerHTML;
}

export function notify(message, {variant, icon, duration} = {}) {
  variant ??= 'primary';
  icon ??= 'info-circle';
  duration ??= 3000;

  const alert = Object.assign(document.createElement('sl-alert'), {
    variant,
    closable: true,
    duration,
    innerHTML: `
      <sl-icon name="${icon}" slot="icon"></sl-icon>
      ${escapeHtml(message)}
    `
  });

  document.body.append(alert);
  return alert.toast();
}
