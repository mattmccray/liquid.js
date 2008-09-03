Liquid.Document = new Class({

  Extends: Liquid.Block,

  initialize: function(tokens){
    this.blockDelimiter = []; // [], really?
    this.parse(tokens);
  },

  assertMissingDelimitation: function() {
    // Documents don't need to assert this...
  }
});