Liquid.Strainer = Klass({

  init: function(context) {
    this.context = context;
  },
  
  respondTo: function(methodName) {
//      if( /^__/.test(methodName)) return false;
    // if((methodName in this))
    //   console.log("FOUND "+ methodName);
    // else
    //   console.log("MISSING "+ methodName);
    return (methodName in this);
  }
});

Liquid.Strainer.filters = {} ;// $H({});

Liquid.Strainer.globalFilter = function(filters) {
  Liquid.Strainer.filters.update(filters);
  Liquid.Strainer.addMethods( filters );
}

// Array of methods to keep...
Liquid.Strainer.requiredMethods = ['respondTo', 'context']; //$A(['respondTo', 'context']); 

Liquid.Strainer.create = function(context) {
   // Not sure all this really matters for JS... Maybe?
  var strainer = new Liquid.Strainer(context);
//    strainer.__proto__ = {};
  // for(key in strainer) {
  //   if(!Liquid.Strainer.filters.keys().include(key) || !Liquid.Strainer.requiredMethods.include(key)) {
  //     console.log('removing '+ key)
  //     delete strainer[key];
  //   }
  // }
  return strainer;
}