/* Copyright (c) 2005, 2006 Tobias Luetke,

   JavaScript port by M@ McCray (http://www.mattmccray.com)
   Requires Mootools 1.2
   
   http://github.com/darthapo/liquid.js/wikis

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
/*

General:

  This is a complete port of Liquid from Ruby to JavaScript. Any template
  that Ruby Liquid can compile and render, Liquid JS should too.

Differences:

  1) Ranges. JavaScript doesn't really have Ranges like Ruby does. So when
     Liquid JS comes across a range "(1..5)", it creates an Array with the
     values 1 through 5. WARNING: It does assume numeric ranges, so (A..Z)
     won't work.

  2) 'replace' and 'replace_first' filters actually build RegExps from the
     input, so you can actually define a regexp to use in your replacement.

  3) 'include' tag. By default, this will return a Liquid error (but not
     an exception). You use the 'include' tag, you'll need to implement your
     own 'filesystem' support. Which, in Liquid JS, just means you override
     the Liquid.readTemplateFile function to suit your own needs. Here's an
     example:
     
        <script>
          
          Liquid.readTemplateFile = function(path) {
            var elem = $(path);
            if(elem) {
              return elem.innerHTML;
            } else {
              path +" can't be found."; // Or throw and error, or whatever you want...
            }
          }
          
          var tmpl = Liquid.parse("{% include 'myOtherTemplate' with current_user %}");
          
          alert( tmpl.render({ current_user:'M@' }));
          
        </script>
        
        <script type="text/liquid" id="myOtherTemplate">
          Hello, {{ current_user }}!
        </script>

Known Issues:

  1) Need good testing framework to put it through it's paces.
  
  2) Not tested in Internet Exploder. Known to work in Safari 3.1+ and FireFox 3+.

References:
  - http://wiki.shopify.com/UsingLiquid

*/
var Liquid = (function(){
  // tag.js
    var Tag = new Class({
    initialize: function(tagName, markup, tokens) {
      this.tagName = tagName;
      this.markup = markup;
      this.nodelist = this.nodelist || [];
      this.parse(tokens);
    },
    
    parse: function(tokens) {
//      console.log("Tag.parse not implemented...");
    },
    
    render: function(context) {
      return '';
    }
    
    // From ruby: def name; self.class.name.downcase; end
  });
  // block.js
  var Block = new Class({
  Extends: Tag,
  
  initialize: function(tagName, markup, tokens){
    this.blockName = tagName;
    this.blockDelimiter = "end"+ this.blockName;
    this.parent(tagName, markup, tokens);
  },
  
  parse: function(tokens) {
    this.nodelist = this.nodelist || [];
    $A(this.nodelist).empty();
    var token = tokens.shift();
    tokens.push(''); // To ensure we don't lose the last token passed in...
    while(tokens.length) { 

      if( /^\{\%/.test(token) ) { // It's a tag...
        var tagParts = token.match(/^\{\%\s*(\w+)\s*(.*)?\%\}$/);
        
        if(tagParts) {
          // if we found the proper block delimitor just end parsing here and let the outer block proceed
          if( this.blockDelimiter == tagParts[1] ) {
            this.endTag();
            return;
          }
          if( tagParts[1] in Template.tags ) {
            this.nodelist.push( new Template.tags[tagParts[1]]( tagParts[1], tagParts[2], tokens ) );
          } else {
            this.unknownTag( tagParts[1], tagParts[2], tokens );
          }
        } else {
          throw ( "Tag '"+ token +"' was not properly terminated with: %}");
        }
      } else if(/^\{\{/.test(token)) { // It's a variable...
        this.nodelist.push( this.createVariable(token) );
      } else { //if(token != '') {
        this.nodelist.push( token );
      } // Ignores tokens that are empty
      token = tokens.shift(); // Assign the next token to loop again...
    }
    
    // Effectively this method will throw and exception unless the current block is of type Document 
    this.assertMissingDelimitation();
  },
  
  endTag: function() {},
  
  unknownTag: function(tag, params, tokens) {
    switch(tag) {
      case 'else': throw (this.blockName +" tag does not expect else tag"); break;
      case 'end':  throw ("'end' is not a valid delimiter for "+ this.blockName +" tags. use "+ this.blockDelimiter); break;
      default:     throw ("Unknown tag: "+ tag);
    }
  },
  
  createVariable: function(token) {
    var match = token.match(/^\{\{(.*)\}\}$/);
    if(match) { return new Variable(match[1]); }
    else { throw ("Variable '"+ token +"' was not properly terminated with: }}"); }
  },
  
  render: function(context) {
    return this.renderAll(this.nodelist, context);
  },
  
  renderAll: function(list, context) {
    return $A(list || []).map(function(token, i){
      var output = '';
      try { // hmmm... feels a little heavy
        output = ( token['render'] ) ? token.render(context) : token;
      } catch(e) {
        output = context.handleError(e);
      }
      return output;
    });
  },
  
  assertMissingDelimitation: function(){
    throw (this.blockName +" tag was never closed");
  }
});
  // document.js  
  var Document = new Class({

  Extends: Block,

  initialize: function(tokens){
    this.blockDelimiter = []; // [], really?
    this.parse(tokens);
  },

  assertMissingDelimitation: function() {
    // Documents don't need to assert this...
  }
});
  // strainer.js
  var Strainer = new Class({

  initialize: function(context) {
    this.context = context;
  },
  
  respondTo: function(methodName) {
//      if( /^__/.test(methodName)) return false;
    return (methodName in this);
  }
});

Strainer.filters = $H({});

Strainer.globalFilter = function(filters) {
  
  Strainer.filters.extend(filters);
}

// Array of methods to keep...
Strainer.requiredMethods = $A(['respondTo', 'context']); 

Strainer.create = function(context) {
   // Not sure all this really matters for JS... Maybe?
  Strainer.implement( Strainer.filters );
  var strainer = new Strainer(context);
//    strainer.__proto__ = {};
  for(key in strainer) {
    if(!Strainer.filters.getKeys().contains(key) || !Strainer.requiredMethods.contains(key)) {
      delete strainer[key];
    }
  }
  return strainer;
}
  // context.js  
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
  // template.js
  var TemplateParser = /(\{\%.*?\%\}|\{\{.*?\}\}?)/;

var Template = new Class({

  initialize: function() {
    this.root = null;
    this.registers = $H({});
    this.assigns = $H({});
    this.errors = [];
    this.rethrowErrors = false;
    this.lastContext = null;
  },

  parse: function(src) {
    this.root = new Document( Template.tokenize(src) );
    return this;
  },

  render: function() {
    if(!this.root){ return ''; }
    var args = $A(arguments).associate(['ctx', 'filters', 'registers']);
    var context = null;
    
    if(args.ctx instanceof Context ) {
      context = args.ctx;
      this.assigns = context.assigns;
      this.registers = context.registers;
    } else {
      if(args.ctx){ this.assigns.extend(args.ctx); }
      if(args.registers){ this.registers.extend(args.registers); }
      context = new Context(this.assigns, this.registers, this.rethrowErrors)
    }
    
    if(args.filters){ context.addFilters(arg.filters); }
    
    try {
      return this.root.render(context).join('');
    } finally {
      this.errors = context.errors;
      this.lastContext = context;
    }
  },
  
  renderWithErrors: function() {
    this.renderWithErrors = true;
    return this.render.apply(this, arguments);
  }
});

Template.fileSystem = {};

Template.tags = {};

Template.registerTag = function(name, klass) {
  Template.tags[ name ] = klass;
}

Template.registerFilter = function(filters) {
  Strainer.globalFilter(filters)
}

Template.tokenize = function(src) {
  var tokens = src.split( TemplateParser );
  // removes the rogue empty element at the beginning of the array
  if(tokens[0] == ''){ tokens.shift(); }
//  console.log("Source tokens:", tokens)
  return tokens;
}


Template.parse =  function(src) {
  return (new Template()).parse(src);
}
  // variable.js
  var Variable = new Class({
  initialize: function(markup) {
    this.markup = markup;
    this.name = null;
    this.filters = [];
    var self = this;
    var match = markup.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)/);
    if( match ) {
      this.name = match[1];
      var filterMatches = markup.match(/\|\s*(.*)/);
      if(filterMatches) {
        var filters = filterMatches[1].split(/\|/);
        filters.each(function(f){
          var matches = f.match(/\s*(\w+)/);
          if(matches) {
            var filterName = matches[1];
            var filterArgs = []
            $A(f.match(/(?:[:|,]\s*)("[^"]+"|'[^']+'|[^\s,|]+)/g) || []).flatten().each(function(arg){
              var cleanupMatch = arg.match(/^[\s|:|,]*(.*?)[\s]*$/);
              if(cleanupMatch)
                { filterArgs.push( cleanupMatch[1] );}
            });
            self.filters.push( [filterName, filterArgs] );
          }
        });
      }
    }
  },
  
  render: function(context) {
    if(this.name == null){ return ''; }
    output = context.get(this.name);
    this.filters.each(function(filter) {
      var filterName = filter[0],
          filterArgs = $A(filter[1] || []).map(function(arg){
            return context.get(arg);
          });
      filterArgs.unshift(output); // Push in input value into the first argument spot...
      output = context.invoke(filterName, filterArgs );
    });

    return output;
  }
});
  // condition.js
  var Condition = new Class({
  initialize: function(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
    this.childRelation = null;
    this.childCondition = null;
    this.attachment = null;
  },
  
  evaluate: function(context) {
    context = context || new Context();
    var result = this.interpretCondition(this.left, this.right, this.operator, context);
    switch(this.childRelation) {
      case 'or':
        return (result || this.childCondition.evaluate(context));
      case 'and':
        return (result && this.childCondition.evaluate(context));
      default:
        return result;
    }
  },
  
  or: function(condition) {
    this.childRelation = 'or';
    this.childCondition = condition;
  },
  
  and: function(condition) {
    this.childRelation = 'and';
    this.childCondition = condition;
  },
  
  attach: function(attachment) {
    this.attachment = attachment;
    return this.attachment;
  },
  
  isElse: false,
  
  interpretCondition: function(left, right, op, context) {
    // If the operator is empty this means that the decision statement is just 
    // a single variable. We can just pull this variable from the context and 
    // return this as the result.
    if(!op)
      { return context.get(left); }
    
    left = context.get(left);
    right = context.get(right);
    op = Condition.operators[op];
    if(!op)
      { throw ("Unknown operator "+ op); }
    
    var results = op(left, right);
    return results;
  },
  
  toString: function() {
    return "<Condition "+ this.left +" "+ this.operator +" "+ this.right +">";
  }
  
});
  
Condition.operators = {
  '==': function(l,r) {  return (l == r); },
  '=':  function(l,r) { return (l == r); },
  '!=': function(l,r) { return (l != r); },
  '<>': function(l,r) { return (l != r); },
  '<':  function(l,r) { return (l < r); },
  '>':  function(l,r) { return (l > r); },
  '<=': function(l,r) { return (l <= r); },
  '>=': function(l,r) { return (l >= r); },

  'contains': function(l,r) { return l.contains(r); },
  'hasKey':   function(l,r) { return $H(l).getKeys().contains(r); },
  'hasValue': function(l,r) { return $H(l).getValue(r); }
}

var ElseCondition = new Class({
  Extends: Condition,
  
  isElse: true,
  
  evaluate: function(context) {
    return true;
  },
  
  toString: function() {
    return "<ElseCondition>";
  }
  
});
  // drop.js
  var Drop = new Class({
  setContext: function(context) {
    this.context = context;
  },
  beforeMethod: function(method) {
    
  },
  invokeDrop: function(method) {
    var results = this.beforeMethod();
    if( !results && (method in this) )
      { results = this[method].apply(this); }
    return results;
  },
  hasKey: function(name) {
    return true;
  }
});
  // default_tags.js
  // Default Tags...
Template.registerTag( 'assign', new Class({

  tagSyntax: /((?:\(?[\w\-\.\[\]]\)?)+)\s*=\s*((?:"[^"]+"|'[^']+'|[^\s,|]+)+)/,
  
  Extends: Tag,
  
  initialize: function(tagName, markup, tokens) {
    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.to   = parts[1];
      this.from = parts[2];
    } else {
      throw ("Syntax error in 'assign' - Valid syntax: assign [var] = [source]");
    }
    this.parent(tagName, markup, tokens)
  },
  render: function(context) {
    context.scopes.getLast()[ this.to.toString() ] = context.get(this.from);
    return '';
  }
}));

// Cache is just like capture, but it inserts into the root scope...
Template.registerTag( 'cache', new Class({
  tagSyntax: /(\w+)/,
  
  Extends: Block,
  
  initialize: function(tagName, markup, tokens) {
    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.to = parts[1];
    } else {
      throw ("Syntax error in 'cache' - Valid syntax: cache [var]");
    }
    this.parent(tagName, markup, tokens);
  },
  render: function(context) {
    var output = this.parent(context);
    context.scopes.getLast()[this.to] = $splat(output).join('');
    return '';
  }
}));


Template.registerTag( 'capture', new Class({
  tagSyntax: /(\w+)/,
  
  Extends: Block,
  
  initialize: function(tagName, markup, tokens) {
    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.to = parts[1];
    } else {
      throw ("Syntax error in 'capture' - Valid syntax: capture [var]");
    }
    this.parent(tagName, markup, tokens);
  },
  render: function(context) {
    var output = this.parent(context);
    context.set( this.to, $splat(output).join('') );
    return '';
  }
}));

Template.registerTag( 'case', new Class({

  tagSyntax     : /("[^"]+"|'[^']+'|[^\s,|]+)/,
  tagWhenSyntax : /("[^"]+"|'[^']+'|[^\s,|]+)(?:(?:\s+or\s+|\s*\,\s*)("[^"]+"|'[^']+'|[^\s,|]+.*))?/,
  
  Extends: Block,
  
  initialize: function(tagName, markup, tokens) {
    this.blocks = [];
    this.nodelist = [];
    
    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.left = parts[1];
    } else {
      throw ("Syntax error in 'case' - Valid syntax: case [condition]");
    }
    
    this.parent(tagName, markup, tokens);
  },
  unknownTag: function(tag, markup, tokens) {
    switch(tag) {
      case 'when':
        this.recordWhenCondition(markup);
        break;
      case 'else':
        this.recordElseCondition(markup);
        break;
      default:
        this.parent(tag, markup, tokens);
    }
    
  },
  render: function(context) {
    var self = this,
        output = $A([]),
        execElseBlock = true;

    context.stack(function(){
      for (var i=0; i < self.blocks.length; i++) {
        var block = self.blocks[i];
        if( block.isElse  ) {
          if(execElseBlock == true){ output.extend(self.renderAll(block.attachment, context)); }
          return output;
        } else if( block.evaluate(context) ) {
          execElseBlock = false;
          output.extend( self.renderAll(block.attachment, context));
        }
      };
    });
    
    return output;
  },
  recordWhenCondition: function(markup) {
    while(markup) {
      var parts = markup.match(this.tagWhenSyntax);
      if(!parts) {
        throw ("Syntax error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %} ");
      }
      
      markup = parts[2];
      
      var block = new Condition(this.left, '==', parts[1]);
      this.blocks.push( block );
      this.nodelist = block.attach([]);
    }
  },
  recordElseCondition: function(markup) {
    if( (markup || '').trim() != '') {
      throw ("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ")
    }
    var block = new ElseCondition();
    this.blocks.push(block);
    this.nodelist = block.attach([]);
  }
}));

Template.registerTag( 'comment', new Class({
  Extends: Block,
  
  render: function(context) {
    return '';
  }
}));

Template.registerTag( 'cycle', new Class({
  Extends: Tag,
  
  tagSimpleSyntax: /"[^"]+"|'[^']+'|[^\s,|]+/,
  tagNamedSyntax:  /("[^"]+"|'[^']+'|[^\s,|]+)\s*\:\s*(.*)/,
  
  initialize: function(tag, markup, tokens) {
    var matches, variables;
    // Named first...
    matches = markup.match(this.tagNamedSyntax);
    if(matches) {
      this.variables = this.variablesFromString(matches[2]);
      this.name = matches[1];
    } else {
      // Try simple...
      matches = markup.match(this.tagSimpleSyntax);
      if(matches) {
        this.variables = this.variablesFromString(markup);
        this.name = "'"+ this.variables.toString() +"'";
      } else {
        // Punt
        throw ("Syntax error in 'cycle' - Valid syntax: cycle [name :] var [, var2, var3 ...]");
      }
    }
    this.parent(tag, markup, tokens);
  },
  
  render: function(context) {
    var self   = this,
        key    = context.get(self.name),
        output = '';

    if(!context.registers['cycle']) {
      context.registers['cycle'] = $H({});
    }
    
    if(!context.registers['cycle'][key]) {
      context.registers['cycle'][key] = 0;
    }
    
    context.stack(function(){
      var iter    = context.registers['cycle'][key],
          results = context.get( self.variables[iter] );
      iter += 1;
      if(iter == self.variables.length){ iter = 0; }
      context.registers['cycle'][key] = iter;
      output = results;
    });
    
    return output;
  },
  
  variablesFromString: function(markup) {
    return markup.split(',').map(function(varname){
      var match = varname.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)\s*/);
      return (match[1]) ? match[1] : null
    });
  }
}));

Template.registerTag( 'for', new Class({
  Extends: Block,
  
  tagSyntax: /(\w+)\s+in\s+((?:\(?[\w\-\.\[\]]\)?)+)/,
  
  initialize: function(tag, markup, tokens) {
    var matches = markup.match(this.tagSyntax);
    if(matches) {
      this.variableName = matches[1];
      this.collectionName = matches[2];
      this.name = this.variableName +"-"+ this.collectionName;
      this.attributes = $H({});
      var attrmarkup = markup.replace(this.tagSyntax, '');
      var attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g);
      if(attMatchs) {
        attMatchs.each(function(pair){
          pair = pair.split(":");
          this.attributes[ pair[0].trim() ] = pair[1].trim();
        }, this);
      }
    } else {
      throw ("Syntax error in 'for loop' - Valid syntax: for [item] in [collection]");
    }
    this.parent(tag, markup, tokens);
  },
  
  render: function(context) {
    var self       = this,
        output     = [],
        collection = $A(context.get(this.collectionName) || []),
        range      = [0, collection.length];
    
    if(!context.registers['for']){ context.registers['for'] = $H({}); }
    
    if(this.attributes['limit'] || this.attributes['offset']) {
      var offset   = 0,
          limit    = 0,
          rangeEnd = 0,
          segement = null;
      
      if(this.attributes['offset'] == 'continue') 
        { offset = context.registers['for'][this.name]; }
      else
        { offset = context.get( this.attributes['offset'] ) || 0; }
      
      limit = context.get( this.attributes['limit'] );
      
      rangeEnd = (limit) ? offset + limit + 1 : collection.length;
      range = [ offset, rangeEnd - 1 ];
      
      // Save the range end in the registers so that future calls to 
      // offset:continue have something to pick up
      context.registers['for'][this.name] = rangeEnd;
    }

    // Assumes the collection is an array like object...
    segment = collection.slice(range[0], range[1]);
    if(!segment || segment.length == 0){ return ''; }
    
    context.stack(function(){
      var length = segment.length;
      
      segment.each(function(item, index){
        context.set( self.variableName, item );
        context.set( 'forloop', {
          name:   self.name,
          length: length,
          index:  (index + 1),
          index0: index,
          rindex: (length - index),
          rindex0:(length - index - 1),
          first:  (index == 0),
          last:   (index == (length - 1))
        });
        output.push( (self.renderAll(self.nodelist, context) || []).join('') );
      });
    });
    
    return output.join('');
  }
}));

Template.registerTag( 'if', new Class({
  Extends: Block,
  
  tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)\s*([=!<>a-z_]+)?\s*("[^"]+"|'[^']+'|[^\s,|]+)?/,
  
  initialize: function(tag, markup, tokens) {
    this.nodelist = [];
    this.blocks = [];
    this.pushBlock('if', markup);
    this.parent(tag, markup, tokens);
  },
  
  unknownTag: function(tag, markup, tokens) {
    if( $A(['elsif', 'else']).contains(tag) ) {
      this.pushBlock(tag, markup);
    } else {
      this.parent(tag, markup, tokens);
    }
  },
  
  render: function(context) {
    var self = this,
        output = '';
    context.stack(function(){
      for (var i=0; i < self.blocks.length; i++) {
        var block = self.blocks[i];
        if( block.evaluate(context) ) {
          output = self.renderAll(block.attachment, context);
          return;
        }
      };
    })
    return output;
  },
  
  pushBlock: function(tag, markup) {
    var block;
    if(tag == 'else') {
      block = new ElseCondition();
    } else {
      var expressions = markup.split(/\b(and|or)\b/).reverse(),
          expMatches  = expressions.shift().match( this.tagSyntax );
      
      if(!expMatches){ throw ("Syntax Error in tag '"+ tag +"' - Valid syntax: "+ tag +" [expression]"); }
      
      var condition = new Condition(expMatches[1], expMatches[2], expMatches[3]);
      
      while(expressions.length > 0) {
        var operator = expressions.shift(),
            expMatches  = expressions.shift().match( this.tagSyntax );
        if(!expMatches){ throw ("Syntax Error in tag '"+ tag +"' - Valid syntax: "+ tag +" [expression]"); }

        var newCondition = new Condition(expMatches[1], expMatches[2], expMatches[3]);
        newCondition[operator](condition);
        condition = newCondition;
      }
      
      block = condition;
    }
    block.attach($A([]));
    this.blocks.push(block);
    this.nodelist = block.attachment;
  }
}));

Template.registerTag( 'ifchanged', new Class({
  Extends: Block,

  render: function(context) {
    var self = this,
        output = '';
    context.stack(function(){
      var results = self.renderAll(self.nodelist, context).join('');
      if(results != context.registers['ifchanged']) {
        output = results;
        context.registers['ifchanged'] = output;
      }
    });
    return output;
  }
}));

Template.registerTag( 'include', new Class({
  Extends: Tag,
  tagSyntax: /((?:"[^"]+"|'[^']+'|[^\s,|]+)+)(\s+(?:with|for)\s+((?:"[^"]+"|'[^']+'|[^\s,|]+)+))?/,
  
  initialize: function(tag, markup, tokens) {
    var matches = (markup || '').match(this.tagSyntax);
    if(matches) {
      this.templateName = matches[1];
      this.templateNameVar = this.templateName.substring(1, this.templateName.length - 1);
      this.variableName = matches[3];
      this.attributes = $H({});

      var attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g);
      if(attMatchs) {
        attMatchs.each(function(pair){
          pair = pair.split(":");
          this.attributes[ pair[0].trim() ] = pair[1].trim();
        }, this);
      }
    } else {
      throw ("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]");
    }
    this.parent(tag, markup, tokens);
  },

  render: function(context) {
    var self     = this,
        source   = Liquid.readTemplateFile( context.get(this.templateName) ),
        partial  = Liquid.parse(source),
        variable = context.get((this.variableName || this.templateNameVar)),
        output   = '';
    context.stack(function(){
      self.attributes.each(function(value, key){
        context.set(key, context.get(value));
      })

      if($type(variable) == 'array') {
        output = variable.map(function(variable){
          context.set( self.templateNameVar, variable );
          return partial.render(context);
        });
      } else {
        context.set(self.templateNameVar, variable);
        output = partial.render(context);
      }
    });
    return $splat(output).join('');
  }
}));

Template.registerTag( 'unless', new Class({
  Extends: Template.tags['if'],

  render: function(context) {
    var self = this,
        output = '';
    context.stack(function(){
      // The first block is called if it evaluates to false...
      var block = self.blocks[0];
      if( !block.evaluate(context) ) {
        output = self.renderAll(block.attachment, context);
        return;
      }
      // the rest are the same..
      for (var i=1; i < self.blocks.length; i++) {
        var block = self.blocks[i];
        if( block.evaluate(context) ) {
          output = self.renderAll(block.attachment, context);
          return;
        }
      };
    })
    return output;
  }
}));
  // default_filters.js
  // Standard Filters
Template.registerFilter({
  
  size: function(iterable) {
    return (iterable['length']) ? iterable.length : 0;
  },
  
  downcase: function(input) {
    return input.toString().toLowerCase();
  },
  
  upcase: function(input) {
    return input.toString().toUpperCase();
  },
  
  capitalize: function(input) {
    return input.toString().capitalize();
  },
  
  escape: function(input) {
    // FIXME: properly HTML escape input...
    input = input.toString();
    input = input.replace(/&/g, '&amp;');
    input = input.replace(/</g, '&lt;');
    input = input.replace(/>/g, '&gt;');
    input = input.replace(/"/g, '&quot;');
    return input;
  },
  
  h: function(input) {
    // FIXME: properly HTML escape input...
    input = input.toString();
    input = input.replace(/&/g, '&amp;');
    input = input.replace(/</g, '&lt;');
    input = input.replace(/>/g, '&gt;');
    input = input.replace(/"/g, '&quot;');
    return input;
  },
  
  truncate: function(input, length, string) {
    if(!input || input == ''){ return ''; }
    length = length || 50;
    string = string || "...";

    var seg = input.slice(0, length);
    return seg + string;
  },
  
  truncatewords: function(input, words, string) {
    if(!input || input == ''){ return ''; }
    words = parseInt(words || 15);
    string = string || '...';
    var wordlist = input.toString().split(" "),
        l = Math.max((words), 0);
    return (wordlist.length > l) ? wordlist.slice(0,l).join(' ') + string : input;
  },

  truncate_words: function(input, words, string) {
    if(!input || input == ''){ return ''; }
    words = parseInt(words || 15);
    string = string || '...';
    var wordlist = input.toString().split(" "),
        l = Math.max((words), 0);
    return (wordlist.length > l) ? wordlist.slice(0,l).join(' ') + string : input;
  },
  
  strip_html: function(input) {
    return input.toString().replace(/<.*?>/g, '');
  },
  
  strip_newlines: function(input) {
    return input.toString().replace(/\n/g, '')
  },
  
  join: function(input, separator) {
    separator = separator ||  ' ';
    return $splat(input).join(separator);
  },
  
  sort: function(input) {
    return $splat(input).sort();
  },
  
  reverse: function(input) {
    return $splat(input).reverse();
  },
  
  replace: function(input, string, replacement) {
    replacement = replacement || '';
    return input.toString().replace(new RegExp(string, 'g'), replacement);
  },
  
  replace_first: function(input, string, replacement) {
    replacement = replacement || '';
    return input.toString().replace(new RegExp(string, ""), replacement);
  },
  
  newline_to_br: function(input) {
    return input.toString().replace(/\n/g, "<br/>\n");
  },
  
  date: function(input, format) {
    var date;
    if( $type(input) == 'date' ){ date = input; }
    if( $type(date) != 'date' && input == 'now'){ date = new Date(); }
    if( $type(date) != 'date' ){ date = new Date(input); }
    if( $type(date) != 'date' ){ date = new Date(Date.parse(input));}
    if( $type(date) != 'date' ){ return input; } // Punt
    return date.strftime(format);
  },
  
  first: function(input) {
    return $splat(input)[0];
  },
  
  last: function(input) {
    input = $splat(input);
    return input[input.length -1];
  }
});
  // api.js
  // = Public API =
return {
  // Classes to export...
  Template: Template,
  Block:    Block,
  Tag:      Tag,
  Drop:     Drop,
  
  readTemplateFile: function(path) {
    throw ("This liquid context does not allow includes.");
  },
  registerFilters: function(filters) {
    Template.registerFilter(filters);
  },
  parse: function(src) {
    return Template.parse(src);
  }
}
})();

// strftime.js
/*
 Date.prototype.strftime LICENSE:

 Copyright (c) 2008, Philip S Tellis <philip@bluesmoon.info>
 All rights reserved.
 This code is distributed under the terms of the BSD licence

 Redistribution and use of this software in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

   * Redistributions of source code must retain the above copyright notice, this list of conditions
     and the following disclaimer.
   * Redistributions in binary form must reproduce the above copyright notice, this list of
     conditions and the following disclaimer in the documentation and/or other materials provided
     with the distribution.
   * The names of the contributors to this file may not be used to endorse or promote products
     derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
// Includes inline strftime support...
if(!(new Date()).strftime) {(function(){
Date.ext={};Date.ext.util={};Date.ext.util.xPad=function(x,pad,r){if(typeof (r)=="undefined"){r=10}for(;parseInt(x,10)<r&&r>1;r/=10){x=pad.toString()+x}return x.toString()};Date.prototype.locale="en-GB";if(document.getElementsByTagName("html")&&document.getElementsByTagName("html")[0].lang){Date.prototype.locale=document.getElementsByTagName("html")[0].lang}Date.ext.locales={};Date.ext.locales.en={a:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],A:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],b:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],B:["January","February","March","April","May","June","July","August","September","October","November","December"],c:"%a %d %b %Y %T %Z",p:["AM","PM"],P:["am","pm"],x:"%d/%m/%y",X:"%T"};Date.ext.locales["en-US"]=Date.ext.locales.en;Date.ext.locales["en-US"].c="%a %d %b %Y %r %Z";Date.ext.locales["en-US"].x="%D";Date.ext.locales["en-US"].X="%r";Date.ext.locales["en-GB"]=Date.ext.locales.en;Date.ext.locales["en-AU"]=Date.ext.locales["en-GB"];Date.ext.formats={a:function(d){return Date.ext.locales[d.locale].a[d.getDay()]},A:function(d){return Date.ext.locales[d.locale].A[d.getDay()]},b:function(d){return Date.ext.locales[d.locale].b[d.getMonth()]},B:function(d){return Date.ext.locales[d.locale].B[d.getMonth()]},c:"toLocaleString",C:function(d){return Date.ext.util.xPad(parseInt(d.getFullYear()/100,10),0)},d:["getDate","0"],e:["getDate"," "],g:function(d){return Date.ext.util.xPad(parseInt(Date.ext.util.G(d)/100,10),0)},G:function(d){var y=d.getFullYear();var V=parseInt(Date.ext.formats.V(d),10);var W=parseInt(Date.ext.formats.W(d),10);if(W>V){y++}else{if(W===0&&V>=52){y--}}return y},H:["getHours","0"],I:function(d){var I=d.getHours()%12;return Date.ext.util.xPad(I===0?12:I,0)},j:function(d){var ms=d-new Date(""+d.getFullYear()+"/1/1 GMT");ms+=d.getTimezoneOffset()*60000;var doy=parseInt(ms/60000/60/24,10)+1;return Date.ext.util.xPad(doy,0,100)},m:function(d){return Date.ext.util.xPad(d.getMonth()+1,0)},M:["getMinutes","0"],p:function(d){return Date.ext.locales[d.locale].p[d.getHours()>=12?1:0]},P:function(d){return Date.ext.locales[d.locale].P[d.getHours()>=12?1:0]},S:["getSeconds","0"],u:function(d){var dow=d.getDay();return dow===0?7:dow},U:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=6-d.getDay();var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0)},V:function(d){var woy=parseInt(Date.ext.formats.W(d),10);var dow1_1=(new Date(""+d.getFullYear()+"/1/1")).getDay();var idow=woy+(dow1_1>4||dow1_1<=1?0:1);if(idow==53&&(new Date(""+d.getFullYear()+"/12/31")).getDay()<4){idow=1}else{if(idow===0){idow=Date.ext.formats.V(new Date(""+(d.getFullYear()-1)+"/12/31"))}}return Date.ext.util.xPad(idow,0)},w:"getDay",W:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=7-Date.ext.formats.u(d);var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0,10)},y:function(d){return Date.ext.util.xPad(d.getFullYear()%100,0)},Y:"getFullYear",z:function(d){var o=d.getTimezoneOffset();var H=Date.ext.util.xPad(parseInt(Math.abs(o/60),10),0);var M=Date.ext.util.xPad(o%60,0);return(o>0?"-":"+")+H+M},Z:function(d){return d.toString().replace(/^.*\(([^)]+)\)$/,"$1")},"%":function(d){return"%"}};Date.ext.aggregates={c:"locale",D:"%m/%d/%y",h:"%b",n:"\n",r:"%I:%M:%S %p",R:"%H:%M",t:"\t",T:"%H:%M:%S",x:"locale",X:"locale"};Date.ext.aggregates.z=Date.ext.formats.z(new Date());Date.ext.aggregates.Z=Date.ext.formats.Z(new Date());Date.ext.unsupported={};Date.prototype.strftime=function(fmt){if(!(this.locale in Date.ext.locales)){if(this.locale.replace(/-[a-zA-Z]+$/,"") in Date.ext.locales){this.locale=this.locale.replace(/-[a-zA-Z]+$/,"")}else{this.locale="en-GB"}}var d=this;while(fmt.match(/%[cDhnrRtTxXzZ]/)){fmt=fmt.replace(/%([cDhnrRtTxXzZ])/g,function(m0,m1){var f=Date.ext.aggregates[m1];return(f=="locale"?Date.ext.locales[d.locale][m1]:f)})}var str=fmt.replace(/%([aAbBCdegGHIjmMpPSuUVwWyY%])/g,function(m0,m1){var f=Date.ext.formats[m1];if(typeof (f)=="string"){return d[f]()}else{if(typeof (f)=="function"){return f.call(d,d)}else{if(typeof (f)=="object"&&typeof (f[0])=="string"){return Date.ext.util.xPad(d[f[0]](),f[1])}else{return m1}}}});d=null;return str};
})();}
