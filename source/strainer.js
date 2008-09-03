Liquid.Strainer = new Class({

  initialize: function(context) {
    this.context = context;
  },
  
  respondTo: function(methodName) {
//      if( /^__/.test(methodName)) return false;
    return (methodName in this);
  }
});

Liquid.Strainer.filters = $H({});

Liquid.Strainer.globalFilter = function(filters) {
  
  Liquid.Strainer.filters.extend(filters);
}

// Array of methods to keep...
Liquid.Strainer.requiredMethods = $A(['respondTo', 'context']); 

Liquid.Strainer.create = function(context) {
   // Not sure all this really matters for JS... Maybe?
  Liquid.Strainer.implement( Liquid.Strainer.filters );
  var strainer = new Liquid.Strainer(context);
//    strainer.__proto__ = {};
  for(key in strainer) {
    if(!Liquid.Strainer.filters.getKeys().contains(key) || !Liquid.Strainer.requiredMethods.contains(key)) {
      delete strainer[key];
    }
  }
  return strainer;
}