Liquid.Block = new Class({
  Extends: Liquid.Tag,
  
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
          if( tagParts[1] in Liquid.Template.tags ) {
            this.nodelist.push( new Liquid.Template.tags[tagParts[1]]( tagParts[1], tagParts[2], tokens ) );
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
    if(match) { return new Liquid.Variable(match[1]); }
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