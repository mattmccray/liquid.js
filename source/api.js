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