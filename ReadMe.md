# Liquid.js

This is a complete port of [Liquid](http://www.liquidmarkup.org/) from Ruby to 
JavaScript. Any template that Ruby Liquid can compile and render, Liquid.js 
should too.

Liquid.js does not use `eval` or `with`, so it's pretty clean and really safe.

## Differences

**Ranges**

JavaScript doesn't really have Ranges like Ruby does. So when  Liquid.js comes 
across a range "(1..5)", it creates an Array with the  values 1 through 5.

In addition ranges like (a..z) should work.

**Replace filters**

'replace' and 'replace_first' filters build RegExps from the input, so you can
actually define a regexp to use in your replacement.

**Include tag**

By default, this will return a Liquid error (but not an exception). To use 
the 'include' tag, you'll need to implement your own 'filesystem' support. 
Which, in Liquid.js, just means you override the Liquid.readTemplateFile 
function to suit your own needs. 

Here's an example:

```html
<script>
  
  Liquid.readTemplateFile = function(path) {
    var elem = document.getElementById(path);
    if(elem) {
      return elem.innerHTML;
    } else {
      return path +" can't be found."; 
      // Or throw and error, or whatever you want...
    }
  }
  
  var src = "{% include 'myOtherTemplate' with current_user %}";

  var tmpl = Liquid.parse( src );
  
  alert( tmpl.render({ current_user:'M@' }));
  
</script>
<!-- Browsers ignore script blocks with an unrecognized type.  -->
<!-- Makes for pretty good inline template storage.  -->
<script type="text/liquid" id="myOtherTemplate">
  Hello, {{ current_user }}!
</script>
```

## Known Issues

- Known to work in Safari 3.1+ and FireFox 3+.
- IE 7: passes tests but needs more actual usage testing

## References:

- [http://wiki.shopify.com/UsingLiquid](http://wiki.shopify.com/UsingLiquid)

## Development

- Clone/fork the repo from github
- Run `npm install` to install all the build dependencies

You're ready to go. The source (coffeescript) files are in the `source/` folder.
To compile, just run:

    make

For tests:

    make test

That's it. Have fun.

### TODO

- Make `readTemplateFile` support async -- maybe like this?

```javascript

Liquid.readTemplateFile= function(path, supply){
  var template_contents= '';

  // Fetch content from XHR, or FileSystem, or whatever

  supply(template_contents);
}

```

- Convert tests to Mocha + Chai