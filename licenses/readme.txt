/*

General:

  This is a complete port of Liquid from Ruby to JavaScript. Any template
  that Ruby Liquid can compile and render, Liquid JS should too.

Differences:

  1) Ranges. JavaScript doesn't really have Ranges like Ruby does. So when
     Liquid JS comes across a range "(1..5)", it uses Prototype's range
     function $R() to create an array of values.

  2) 'replace' and 'replace_first' filters actually build RegExps from the
     input, so you can actually define a regexp to use in your replacement.

  3) 'include' tag. By default, this will return a Liquid error (but not
     an exception). You use the 'include' tag, you'll need to implement your
     own 'filesystem' support. Which, in Liquid JS, just means you override
     the Liquid.readTemplateFile function to suit your own needs. Here's an
     example:
     
        <script>
          
          Liquid.readTemplateFile = function(path) {
            var elem = $(path);
            if(elem) {
              return elem.innerHTML;
            } else {
              path +" can't be found."; // Or throw and error, or whatever you want...
            }
          }
          
          var tmpl = Liquid.parse("{% include 'myOtherTemplate' with current_user %}");
          
          alert( tmpl.render({ current_user:'M@' }));
          
        </script>
        
        <script type="text/liquid" id="myOtherTemplate">
          Hello, {{ current_user }}!
        </script>

Known Issues:

  2) Not tested in Internet Exploder. Known to work in Safari 3.1+, FireFox 3+, and Adobe Air 1.1+.

References:
  - http://wiki.shopify.com/UsingLiquid

*/