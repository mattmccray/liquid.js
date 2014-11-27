var hackObjectEach = function(fun /*, thisp*/) {
  if (typeof fun != "function")
    throw 'Object.each requires first argument to be a function';

  var i = 0;
  var thisp = arguments[1];
  for (var p in this) {
    var value = this[p], pair = [p, value];
    pair.key = p;
    pair.value = value;
    fun.call(thisp, pair, i, this);
    i++;
  }

  return null;
};

// Default Tags...
Liquid.Template.registerTag( 'assign', Liquid.Tag.extend({

  tagSyntax: /((?:\(?[\w\-\.\[\]]\)?)+)\s*=\s*(.+)/,

  init: function(tagName, markup, tokens) {
    var parts = markup.match(this.tagSyntax);
    if( parts ) {
      this.to   = parts[1];
      this.from = parts[2];
    } else {
      throw ("Syntax error in 'assign' - Valid syntax: assign [var] = [source]");
    }
    this._super(tagName, markup, tokens)
  },
  render: function(context) {
    var value = new Liquid.Variable(this.from);
    context.scopes.last()[this.to.toString()] = value.render(context);
    return '';
  }
}));

// Cache is just like capture, but it inserts into the root scope...
Liquid.Template.registerTag( 'cache', Liquid.Block.extend({
  tagSyntax: /(\w+)/,

  init: function(tagName, markup, tokens) {
    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.to = parts[1];
    } else {
      throw ("Syntax error in 'cache' - Valid syntax: cache [var]");
    }
    this._super(tagName, markup, tokens);
  },
  render: function(context) {
    var output = this._super(context);
    context.scopes.last()[this.to] = [output].flatten().join('');
    return '';
  }
}));


Liquid.Template.registerTag( 'capture', Liquid.Block.extend({
  tagSyntax: /(\w+)/,

  init: function(tagName, markup, tokens) {
    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.to = parts[1];
    } else {
      throw ("Syntax error in 'capture' - Valid syntax: capture [var]");
    }
    this._super(tagName, markup, tokens);
  },
  render: function(context) {
    var output = this._super(context);
    context.scopes.last()[this.to.toString()] = [output].flatten().join('');
    return '';
  }
}));

Liquid.Template.registerTag( 'case', Liquid.Block.extend({

  tagSyntax     : /("[^"]+"|'[^']+'|[^\s,|]+)/,
  tagWhenSyntax : /("[^"]+"|'[^']+'|[^\s,|]+)(?:(?:\s+or\s+|\s*\,\s*)("[^"]+"|'[^']+'|[^\s,|]+.*))?/,

  init: function(tagName, markup, tokens) {
    this.blocks = [];
    this.nodelist = [];

    var parts = markup.match(this.tagSyntax)
    if( parts ) {
      this.left = parts[1];
    } else {
      throw ("Syntax error in 'case' - Valid syntax: case [condition]");
    }

    this._super(tagName, markup, tokens);
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
        this._super(tag, markup, tokens);
    }

  },
  render: function(context) {
    var self = this,
        output = [],
        execElseBlock = true;

    context.stack(function(){
      for (var i=0; i < self.blocks.length; i++) {
        var block = self.blocks[i];
        if( block.isElse  ) {
          if(execElseBlock == true){ output = [output, self.renderAll(block.attachment, context)].flatten(); }
          return output;
        } else if( block.evaluate(context) ) {
          execElseBlock = false;
          output = [output, self.renderAll(block.attachment, context)].flatten();
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

      var block = new Liquid.Condition(this.left, '==', parts[1]);
      this.blocks.push( block );
      this.nodelist = block.attach([]);
    }
  },
  recordElseCondition: function(markup) {
    if( (markup || '').strip() != '') {
      throw ("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ")
    }
    var block = new Liquid.ElseCondition();
    this.blocks.push(block);
    this.nodelist = block.attach([]);
  }
}));

Liquid.Template.registerTag( 'comment', Liquid.Block.extend({
  render: function(context) {
    return '';
  }
}));

Liquid.Template.registerTag( 'cycle', Liquid.Tag.extend({

  tagSimpleSyntax: /"[^"]+"|'[^']+'|[^\s,|]+/,
  tagNamedSyntax:  /("[^"]+"|'[^']+'|[^\s,|]+)\s*\:\s*(.*)/,

  init: function(tag, markup, tokens) {
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
    this._super(tag, markup, tokens);
  },

  render: function(context) {
    var self   = this,
        key    = context.get(self.name),
        output = '';

    if(!context.registers['cycle']) {
      context.registers['cycle'] = {};
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

Liquid.Template.registerTag( 'for', Liquid.Block.extend({
  tagSyntax: /(\w+)\s+in\s+((?:\(?[\w\-\.\[\]]\)?)+)/,

  init: function(tag, markup, tokens) {
    var matches = markup.match(this.tagSyntax);
    if(matches) {
      this.variableName = matches[1];
      this.collectionName = matches[2];
      this.name = this.variableName +"-"+ this.collectionName;
      this.attributes = {};
      var attrmarkup = markup.replace(this.tagSyntax, '');
      var attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g);
      if(attMatchs) {
        attMatchs.each(function(pair){
          pair = pair.split(":");
          this.attributes[pair[0].strip()] = pair[1].strip();
        }, this);
      }
    } else {
      throw ("Syntax error in 'for loop' - Valid syntax: for [item] in [collection]");
    }
    this._super(tag, markup, tokens);
  },

  render: function(context) {
    var self       = this,
        output     = [],
        collection = (context.get(this.collectionName) || []),
        range      = [0, collection.length];

    if(!context.registers['for']){ context.registers['for'] = {}; }

    if(this.attributes['limit'] || this.attributes['offset']) {
      var offset   = 0,
          limit    = 0,
          rangeEnd = 0,
          segment = null;

      if(this.attributes['offset'] == 'continue')
        { offset = context.registers['for'][this.name]; }
      else
        { offset = context.get( this.attributes['offset'] ) || 0; }

      limit = context.get( this.attributes['limit'] );

      rangeEnd = (limit) ? offset + limit + 1 : collection.length;
      range = [ offset, rangeEnd - 1 ];

//       // Save the range end in the registers so that future calls to
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

    return [output].flatten().join('');
  }
}));

Liquid.Template.registerTag( 'if', Liquid.Block.extend({

  tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)\s*([=!<>a-z_]+)?\s*("[^"]+"|'[^']+'|[^\s,|]+)?/,

  init: function(tag, markup, tokens) {
    this.nodelist = [];
    this.blocks = [];
    this.pushBlock('if', markup);
    this._super(tag, markup, tokens);
  },

  unknownTag: function(tag, markup, tokens) {
    if( ['elsif', 'else'].include(tag) ) {
      this.pushBlock(tag, markup);
    } else {
      this._super(tag, markup, tokens);
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
    return [output].flatten().join('');
  },

  pushBlock: function(tag, markup) {
    var block;
    if(tag == 'else') {
      block = new Liquid.ElseCondition();
    } else {
      var expressions = markup.split(/\b(and|or)\b/).reverse(),
          expMatches  = expressions.shift().match( this.tagSyntax );

      if(!expMatches){ throw ("Syntax Error in tag '"+ tag +"' - Valid syntax: "+ tag +" [expression]"); }

      var condition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3]);

      while(expressions.length > 0) {
        var operator = expressions.shift(),
            expMatches  = expressions.shift().match( this.tagSyntax );
        if(!expMatches){ throw ("Syntax Error in tag '"+ tag +"' - Valid syntax: "+ tag +" [expression]"); }

        var newCondition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3]);
        newCondition[operator](condition);
        condition = newCondition;
      }

      block = condition;
    }
    block.attach([]);
    this.blocks.push(block);
    this.nodelist = block.attachment;
  }
}));

Liquid.Template.registerTag( 'ifchanged', Liquid.Block.extend({

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

Liquid.Template.registerTag( 'include', Liquid.Tag.extend({

  tagSyntax: /((?:"[^"]+"|'[^']+'|[^\s,|]+)+)(\s+(?:with|for)\s+((?:"[^"]+"|'[^']+'|[^\s,|]+)+))?/,

  init: function(tag, markup, tokens) {
    var matches = (markup || '').match(this.tagSyntax);
    if(matches) {
      this.templateName = matches[1];
      this.templateNameVar = this.templateName.substring(1, this.templateName.length - 1);
      this.variableName = matches[3];
      this.attributes = {};

      var attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g);
      if(attMatchs) {
        attMatchs.each(function(pair){
          pair = pair.split(":");
          this.attributes[pair[0].strip()] = pair[1].strip();
        }, this);
      }
    } else {
      throw ("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]");
    }
    this._super(tag, markup, tokens);
  },

  render: function(context) {
    var self     = this,
        source   = Liquid.readTemplateFile( context.get(this.templateName) ),
        partial  = Liquid.parse(source),
        variable = context.get((this.variableName || this.templateNameVar)),
        output   = '';
    context.stack(function(){
      // HACK Until we get Object.each working right
      self.attributes.each = hackObjectEach;
      self.attributes.each(function(pair){
        context.set(pair.key, context.get(pair.value));
      })

      if(variable instanceof Array) {
        output = variable.map(function(variable){
          context.set( self.templateNameVar, variable );
          return partial.render(context);
        });
      } else {
        context.set(self.templateNameVar, variable);
        output = partial.render(context);
      }
    });
    output = [output].flatten().join('');
    return output
  }
}));

Liquid.Template.registerTag( 'unless', Liquid.Template.tags['if'].extend({

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
    return [output].flatten().join('');
  }
}));

Liquid.Template.registerTag( 'raw', Liquid.Block.extend({
  // Override the `parse` function of Liquid.Block to simply pass along all tokens
  // to render directly (rather than parsing them) until we reach {% endraw %}
  parse: function(tokens) {
    if (!this.nodelist) this.nodelist = [];
    this.nodelist.clear();

    var token = tokens.shift();
    tokens.push('');
    while(tokens.length) {

      if( /^\{\%/.test(token) ) { // It's a tag...
        var tagParts = token.match(/^\{\%\s*(\w+)\s*(.*)?\%\}$/);

        if(tagParts) {
          // if we found the proper block delimitor just end parsing here and let
          // the outer block proceed
          if( this.blockDelimiter == tagParts[1] ) {
            this.endTag();
            return;
          }
        }
      }

      // As long as we didn't hit {% endraw %}, just render whatever we've got
      // without processing it.
      this.nodelist.push( token || '');
      token = tokens.shift(); // Assign the next token to loop again...
    }
    this.assertMissingDelimitation();
  },

  render: function(context) {
    return this.nodelist.join('');
  }
}));
