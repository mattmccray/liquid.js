var SquareBracketed = /^\[(.*)\]$/;
var VariableParser  = /\[[^\]]+\]|(?:[\w\-]\??)+/g;

var Context = new Class({

  initialize: function(assigns, registers, rethrowErrors) {
    this.scopes = [ $H(assigns || {}) ];
    this.registers = registers || {};
    this.errors = [];
    this.rethrowErrors = rethrowErrors;
    this.strainer = Strainer.create(this);
  },
  
  get: function(varname) {
    return this.resolve(varname);
  },
  
  set: function(varname, value) {
    this.scopes[0][varname] = value;
  },
  
  hasKey: function(key) {
    return (this.resolve(key)) ? true : false;
  },
  
  push: function() {
    var scpObj = $H({});
    this.scopes.unshift(scpObj);
    return scpObj // Is this right?
  },
  
  merge: function(newScope) {
    return this.scopes[0].extend(newScope);
  },
  
  pop: function() {
    if(this.scopes.length == 1){ throw "Context stack error"; }
    return this.scopes.shift();
  },
  
  stack: function(lambda, bind) {
    var result = null;
    this.push();
    try {
      result = lambda.apply(bind || this.strainer);
    } finally {
      this.pop();
    }
    return result;
  },
  
  invoke: function(method, args) {
    if( this.strainer.respondTo(method) ) {
      return this.strainer[method].run(args, this.strainer);
    } else {
      return $pick(args);
    }
  },
  
  resolve: function(key) {
    switch(key) {
      case null:
      case 'nil':
      case 'null':
      case '':
        return null;
      
      case 'true':
        return true;
        
      case 'false':
        return false;
      
      // Not sure what to do with (what would be) Symbols
      case 'blank':
      case 'empty':
        return '';
      
      default:
        if(key.test(/^'(.*)'$/))      // Single quoted strings
          { return key.replace(/^'(.*)'$/, '$1'); }
        else if(key.test(/^"(.*)"$/)) // Double quoted strings
          { return key.replace(/^"(.*)"$/, '$1'); }
        else if(key.test(/^(\d+)$/ )) // Integer...
          { return parseInt( key.replace(/^(\d+)$/ , '$1') ); }
        else if(key.test(/^(\d[\d\.]+)$/)) // Float...
          { return parseFloat( key.replace(/^(\d[\d\.]+)$/, '$1') ); }
        else if(key.test(/^\((\S+)\.\.(\S+)\)$/)) {// Ranges 
          // FIXME: This assumes number ranges... Add support for character ranges too...
          // JavaScript doesn't have native support for those, so I turn 'em into an array of integers...
          var range = key.match(/^\((\S+)\.\.(\S+)\)$/),
              arr   = $A([]),
              left  = range[1],
              right = range[2];
          if(left > right) { // Counting down...
            for( var i = left; i >= right; i--) {
              arr.push(i);
            };
          } else { // Counting up...
            for( var i = left; i <= right; i++) {
              arr.push(i);
            };
          }
          return arr;
        } else {
          return this.variable(key); }
    }
  },
  
  findVariable: function(key) {
    for (var i=0; i < this.scopes.length; i++) {
      var scope = this.scopes[i];
      if( scope && (key in scope) ) {
        var variable = scope[key];
        if($type(variable) == 'function')
          { variable = scope[key] = variable.apply(this); }
        if($type(variable) == 'object' && ('toLiquid' in variable))
          { variable = variable.toLiquid(); }
        if($type(variable) == 'object' && ('setContext' in variable))
          { variable.setContext(self); }
        return variable;
      }
    };
    return null;
  },
  
  variable: function(markup) {
    //return this.scopes[0][key] || ''
    var parts       = markup.match( VariableParser ),
        firstPart   = parts.shift(),
        squareMatch = firstPart.match(SquareBracketed);

    if(squareMatch)
      { firstPart = this.resolve( squareMatch[1] ); }
    
    var object = this.findVariable(firstPart),
        self = this;

    // Does 'pos' need to be scoped up here?
    if(object) {
      parts.each(function(part){
        // If object is a hash we look for the presence of the key and if its available we return it
        var squareMatch = part.match(SquareBracketed);
        if(squareMatch) {
          var part = self.resolve(squareMatch[1]);
          // Where the hell does 'pos' come from?
          if( $type(object[part]) == 'function'){ object[pos] = object[part].apply(this); }// Array?
          object = object[part];
          if($type(object) == 'object' && ('toLiquid' in object)){ object = object.toLiquid(); }
        } else {
          // Hash
          if( ($type(object) == 'object' || $type(object) == 'hash') && (part in object)) {
            // if its a proc we will replace the entry in the hash table with the proc
            res = object[part];
            if( $type(res) == 'function'){ res = object[part] = res.apply(self) ; }
            if( $type(res) == 'object' && ('toLiquid' in res)){ object = res.toLiquid(); }
            else { object = res; }
          }
          // Array
          else if( (/^\d+$/).test(part) ) {
            pos = parseInt(part);
            if( $type(object[pos]) == 'function') { object[pos] = object[pos].apply(self); }
            if($type(object[pos]) == 'object' && $type(object[pos]) == 'object' && ('toLiquid' in object[pos])) { object = object[pos].toLiquid(); }
            else { object  = object[pos]; }
          }
          // Some special cases. If no key with the same name was found we interpret following calls
          // as commands and call them on the current object
          else if( $type(object[part]) == 'function' && ['length', 'size', 'first', 'last'].contains(part) ) {
            object = object[part].apply(part);
            if('toLiquid' in object){ object = object.toLiquid(); }
          }
          // No key was present with the desired value and it wasn't one of the directly supported
          // keywords either. The only thing we got left is to return nil
          else {
            return null;
          }
          if($type(object) == 'object' && ('setContext' in object)){ object.setContext(self); }
        }
      });
    }
    return object;
  },
  
  addFilters: function(filters) {
    filters = $splat(filters).flatten();
    filters.each(function(f){
      if($type(f) != 'object'){ throw ("Expected object but got: "+ $type(f)) }
      this.strainer.implement(f);
    });
  },
  
  handleError: function(err) {
    this.errors.push(err);
    if(this.rethrowErrors){ throw err; }
    return "Liquid error: "+ (err.message || err.description || err);
  }

});