Array.prototype.random = Array.prototype.random || function() { return this[Math.floor((Math.random()*this.length))] };
Array.prototype.first = Array.prototype.first || function() { return this[0] }
Array.prototype.last = Array.prototype.last || function() { return this[this.length - 1] }