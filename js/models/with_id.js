let random = function() {
  return (this && this.window?.crypto?.randomUUID)
    ? crypto.randomUUID()
    : `aaaaa-aaaaa-aaaaaaaaaa-${new Date().getTime()}`;
}

export function makeId(...components) {
  return [...components, random()].map(c => (c || "undef").toString().toLowerCase().replace(/[^0-9a-z-]+/g, "-")).join("--");
}
