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
  return tokens;
}


Template.parse =  function(src) {
  return (new Template()).parse(src);
}