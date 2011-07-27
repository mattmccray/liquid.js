Liquid.Drop = Class.extend({
  setContext: function(context) {
    this.context = context;
  },
  beforeMethod: function(method) {
    
  },
  invokeDrop: function(method) {
    var results = this.beforeMethod();
    if( !results && (method in this) )
      { results = this[method].apply(this); }
    return results;
  },
  hasKey: function(name) {
    return true;
  }
});
