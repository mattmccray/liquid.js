// John Resig's browser stuff...
load('test/env/dom.js');

// Liquid dependencies

// Flippin' strftime needs this:
var document = {
  getElementsByTagName: function() {
    return false;
  }
}

//  Load liquid...
load('dist/liquid.js');

//  Load tests...
load('test/tests.js');

// Load testing framework...
load('test/env/test-runner-console.js');
