Liquid.Template = Class.create({

  initialize: function() {
    this.root = null;
    this.registers = $H({});
    this.assigns = $H({});
    this.errors = [];
    this.rethrowErrors = false;
    this.lastContext = null;
  },

  parse: function(src) {
    this.root = new Liquid.Document( Liquid.Template.tokenize(src) );
    return this;
  },

  render: function() {
    if(!this.root){ return ''; }
    var args = {
      ctx: arguments[0],
      filters: arguments[1],
      registers: arguments[2]
    }
    var context = null;
    
    if(args.ctx instanceof Liquid.Context ) {
      context = args.ctx;
      this.assigns = context.assigns;
      this.registers = context.registers;
    } else {
      if(args.ctx){ this.assigns.update(args.ctx); }
      if(args.registers){ this.registers.update(args.registers); }
      context = new Liquid.Context(this.assigns, this.registers, this.rethrowErrors)
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


Liquid.Template.tags = {};

Liquid.Template.registerTag = function(name, klass) {
  Liquid.Template.tags[ name ] = klass;
}

Liquid.Template.registerFilter = function(filters) {
  Liquid.Strainer.globalFilter(filters)
}

Liquid.Template.tokenize = function(src) {
  var tokens = src.split( /(\{\%.*?\%\}|\{\{.*?\}\}?)/ );
  // removes the rogue empty element at the beginning of the array
  if(tokens[0] == ''){ tokens.shift(); }
//  console.log("Source tokens:", tokens)
  return tokens;
}


Liquid.Template.parse =  function(src) {
  return (new Liquid.Template()).parse(src);
}