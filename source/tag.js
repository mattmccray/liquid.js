Liquid.Tag = Class.extend({

  init: function(tagName, markup, tokens) {
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
