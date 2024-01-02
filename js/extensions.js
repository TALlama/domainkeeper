Array.prototype.random = Array.prototype.random || function() { return this[Math.floor((Math.random()*this.length))] };
Array.prototype.first = Array.prototype.first || function() { return this[0] }
Array.prototype.last = Array.prototype.last || function() { return this[this.length - 1] }
Array.prototype.count = Array.prototype.count || function(fn) { return this.filter(fn).length }
Array.prototype.toDictionary = Array.prototype.toDictionary || function(fn) {
  let retval = {};
  this.forEach(element => {
    let [key, value] = fn ? fn(element) : element;
    retval[key] = value;
  });
  return retval;
}

String.prototype.escapeHtml = String.prototype.escapeHtml || function() {
  const el = document.createElement("div");
  el.innerText = this;
  return el.innerHTML;
}
