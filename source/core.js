var Liquid = {

  version: {
    major: 1,
    minor: 1,
    build: 1,
    toString: function(){ return [this.major, this.minor, this.build].join('.'); }
  },

  readTemplateFile: function(path) {
    throw ("This liquid context does not allow includes.");
  },
  
  registerFilters: function(filters) {
    Liquid.Template.registerFilter(filters);
  },
  
  parse: function(src) {
    return Liquid.Template.parse(src);
  }
  
}