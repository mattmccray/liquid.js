// Array.indexOf
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(obj) {
    for (var i=0; i<this.length; i++) {
      if (this[i] == obj) return i;
    }
    
    return -1;
  };
}

// Array.clear
if (!Array.prototype.clear) {
  Array.prototype.clear = function() {
    //while (this.length > 0) this.pop();
    this.length = 0;
  };
}

// Array.map
if (!Array.prototype.map) {
  Array.prototype.map = function(fun /*, thisp*/) {
    var len = this.length;
    if (typeof fun != "function")
      throw 'Array.map requires first argument to be a function';

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in this)
        res[i] = fun.call(thisp, this[i], i, this);
    }

    return res;
  };
}

// Array.first
if (!Array.prototype.first) {
  Array.prototype.first = function() {
    return this[0];
  };
}

// Array.last
if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}

// Array.flatten
if (!Array.prototype.flatten) {
  Array.prototype.flatten = function() {
    var len = this.length;
    var arr = [];
    for (var i = 0; i < len; i++) {
      // TODO This supposedly isn't safe in multiple frames;
      // http://stackoverflow.com/questions/767486/how-do-you-check-if-a-variable-is-an-array-in-javascript
      // http://stackoverflow.com/questions/4775722/javascript-check-if-object-is-array
      if (this[i] instanceof Array) {
        arr = arr.concat(this[i]);
      } else {
        arr.push(this[i]);
      }
    }

    return arr;
  };
}

// Array.each
if (!Array.prototype.each) {
  Array.prototype.each = function(fun /*, thisp*/) {
    var len = this.length;
    if (typeof fun != "function")
      throw 'Array.each requires first argument to be a function';

    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in this)
        fun.call(thisp, this[i], i, this);
    }

    return null;
  };
}

// Array.include
if (!Array.prototype.include) {
  Array.prototype.include = function(arg) {
    var len = this.length;

    return this.indexOf(arg) >= 0;
    for (var i = 0; i < len; i++) {
      if (arg == this[i]) return true;
    }

    return false;
  };
}


// String.capitalize
if (!String.prototype.capitalize) {
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  };
}

// String.strip
if (!String.prototype.strip) {
  String.prototype.strip = function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  };
}


// NOTE Having issues conflicting with jQuery stuff when setting Object 
// prototype settings; instead add into Liquid.Object.extensions and use in 
// the particular location; can add into Object.prototype later if we want.
Liquid.extensions = {};
Liquid.extensions.object = {};

// Object.update
Liquid.extensions.object.update = function(newObj) {
  for (var p in newObj) {
    this[p] = newObj[p];
  }

  return this;
};
//if (!Object.prototype.update) {
//  Object.prototype.update = Liquid.extensions.object.update
//}

// Object.hasKey
Liquid.extensions.object.hasKey = function(arg) {
  return !!this[arg];
};
//if (!Object.prototype.hasKey) {
//  Object.prototype.hasKey = Liquid.extensions.object.hasKey
//}

// Object.hasValue
Liquid.extensions.object.hasValue = function(arg) {
  for (var p in this) {
    if (this[p] == arg) return true;
  }

  return false;
};
//if (!Object.prototype.hasValue) {
//  Object.prototype.hasValue = Liquid.extensions.object.hasValue
//}

