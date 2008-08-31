// John Resig's browser stuff...
load('test/env/dom.js');
// Liquid dependencies
load('etc/mootools-1.2-core.js');
// Flippin' strftime needs this:
var document = {
  getElementsByTagName: function() {
    return false;
  }
}
//  Load liquid...
load('dist/liquid.js');
// Start testing...

print("Testing!");



print("Done")