var Liquid = {

  author: '<%= AUTHOR %>',
  version: '<%= VERSION %>',

  readTemplateFile: function(path) {
    throw ("This liquid context does not allow includes.");
  },

  registerFilters: function(filters) {
    Liquid.Template.registerFilter(filters);
  },

  parse: function(src) {
    return Liquid.Template.parse(src);
  }

};

//= require "extensions"
//= require "class"
//= require "tag"
//= require "block"
//= require "document"
//= require "strainer"
//= require "context"
//= require "template"
//= require "variable"
//= require "condition"
//= require "drop"
//= require "default_tags"
//= require "default_filters"

if (typeof window !== 'undefined') {
  //= require <strftime>
}
//= require <split>

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Liquid;
  }
  exports.Liquid = Liquid;
}
