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