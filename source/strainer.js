var Strainer = new Class({

  initialize: function(context) {
    this.context = context;
  },
  
  respondTo: function(methodName) {
//      if( /^__/.test(methodName)) return false;
    return (methodName in this);
  }
});

Strainer.filters = $H({});

Strainer.globalFilter = function(filters) {
  
  Strainer.filters.extend(filters);
}

// Array of methods to keep...
Strainer.requiredMethods = $A(['respondTo', 'context']); 

Strainer.create = function(context) {
   // Not sure all this really matters for JS... Maybe?
  Strainer.implement( Strainer.filters );
  var strainer = new Strainer(context);
//    strainer.__proto__ = {};
  for(key in strainer) {
    if(!Strainer.filters.getKeys().contains(key) || !Strainer.requiredMethods.contains(key)) {
      delete strainer[key];
    }
  }
  return strainer;
}