
var Tests = (function() { 
  // helper functions...
  function render(src, ctx) {
    return Liquid.parse(src).render(ctx);
  }
  return {

    title: "Liquid.js",
    description: "Runs through all the main tags and filters to ensure compatibility with the Ruby version.",
    auto_test: true,
  
    'Verify API': function() {
      assertDefined( typeof Liquid,           "Liquid is missing" );
      assertDefined( typeof Liquid.Template,  "Liquid.Template is missing" );
      assertDefined( typeof Liquid.Drop,      "Liquid.Drop is missing" );
      assertDefined( typeof Liquid.Tag,       "Liquid.Tag is missing" );
      assertDefined( typeof Liquid.Block,     "Liquid.Tag is missing" );
    },
    
    "Plain text pass-thru": function() {
      assertEqual( 'plain text', render('plain text')  )
    },

    note1: "Testing variables...",

    "{{ 'string literal' }}": function() {
      assertEqual( 'string literal', render('{{"string literal"}}')  )
      assertEqual( 'string literal', render('{{ "string literal" }}')  )
      assertEqual( 'string literal', render("{{'string literal'}}")  )
      assertEqual( 'string literal', render("{{ 'string literal' }}")  )
      assertEqual( 'string "literal"', render("{{'string \"literal\"'}}")  )
      assertEqual( 'string "literal"', render("{{ 'string \"literal\"' }}")  )
    },

    "{{ 10 }}": function() {
      assertEqual( '10', render('{{10}}')  )
      assertEqual( '10', render('{{ 10 }}')  )
    },

    "{{ 5.5 }}": function() {
      assertEqual( '5.5', render('{{5.5}}')  )
      assertEqual( '5.5', render('{{ 5.5 }}')  )
    },

    "{{ (1..5) }}": function() {
      assertEqual( '1,2,3,4,5', render('{{(1..5)}}')  )
      assertEqual( '1,2,3,4,5', render('{{ (1..5) }}')  )
    },
    "{{ (a..e) }}": function() {
      assertEqual( 'a,b,c,d,e', render('{{(a..e)}}')  )
    },
    
    '{{ varname }}': function() {
      assertEqual( 'Bob', render("{{ user }}", {user:'Bob'})  )
    },
    
    '{{ parent.child }}': function() {
      assertEqual( 'Bob', render("{{ user.name }}", {user:{ name:'Bob' }})  )
    },

    '{{ collection[0] }}': function() {
      assertEqual( 'Bob', render("{{ users[0] }}", {users:['Bob']})  )
    },

    '{{ collection[0].child }}': function() {
      assertEqual( 'Bob', render("{{ users[0].name }}", {users:[{name:'Bob'}]})  )
    },
    
    note2: "Testing filters...",

    '{{ string | size }}': function() {
      assertEqual( '3', render("{{user|size}}", {user:'Bob'})  )
      assertEqual( '3', render("{{ user | size }}", {user:'Bob'})  )
    },

    '{{ collection | size }}': function() {
      assertEqual( '3', render("{{user|size}}", {user:['','','']})  )
      assertEqual( '3', render("{{ user | size }}", {user:['','','']})  )
    },
    
    '{{ string | upcase }}': function() {
      assertEqual( 'BOB', render("{{user|upcase}}", {user:'Bob'})  )
      assertEqual( 'BOB', render("{{ user | upcase }}", {user:'Bob'})  )
    },

    '{{ string | downcase }}': function() {
      assertEqual( 'bob', render("{{user|downcase}}", {user:'Bob'})  )
      assertEqual( 'bob', render("{{ user | downcase }}", {user:'Bob'})  )
    },
    
    '{{ string | capitalize }}': function() {
      assertEqual( 'Bob', render("{{user|capitalize}}", {user:'bob'})  )
      assertEqual( 'Bob', render("{{ user | capitalize }}", {user:'bob'})  )
    },
    
    '{{ string | escape }}': function() {
      assertEqual( '&lt;br/&gt;', render("{{'<br/>'|escape}}")  )
      assertEqual( '&lt;br/&gt;', render("{{ '<br/>' | escape }}")  )
      assertEqual( 'this &amp; &quot;that&quot;', render("{{ 'this & \"that\"' | escape }}")  )
    },


    '{{ string | truncate }}': function() {
      assertEqual( 
        'I am the very model of a modern major general, rea...', 
        render("{{'I am the very model of a modern major general, really.'|truncate}}")
      );
      assertEqual( 
        'I am the very model of a modern major general, rea...', 
        render("{{'I am the very model of a modern major general, really.' | truncate}}")
      );
    },

    '{{ string | truncate:2 }}': function() {
      assertEqual( 'Bo...', render("{{user|truncate:2}}", {user:'Bob'})  )
      assertEqual( 'Bo...', render("{{ user | truncate:2 }}", {user:'Bob'})  )
      assertEqual( 'Bo...', render("{{ user | truncate: 2 }}", {user:'Bob'})  )
    },

    "{{ string | truncate:1,'-' }}": function() {
      assertEqual( 'B-', render("{{user|truncate:1,'-'}}", {user:'Bob'})  )
      assertEqual( 'B-', render("{{ user | truncate:1,'-' }}", {user:'Bob'})  )
      assertEqual( 'B-', render("{{ user | truncate: 1,'-' }}", {user:'Bob'})  )
      assertEqual( 'B-', render("{{ user | truncate: 1, '-' }}", {user:'Bob'})  )
    },

    '{{ string | truncatewords }}': function() {
      assertEqual( 
        'a b c d e f g h i j k l m n o...', 
        render("{{'a b c d e f g h i j k l m n o p q r s t u v w x y z'|truncatewords}}")
      );
      assertEqual( 
        'a b c d e f g h i j k l m n o...', 
        render("{{ 'a b c d e f g h i j k l m n o p q r s t u v w x y z' | truncatewords }}")
      );
    },

    '{{ string | truncatewords:5 }}': function() {
      assertEqual( 
        'a b c d e...', 
        render("{{'a b c d e f g h i j k l m n o p q r s t u v w x y z'|truncatewords:5}}")
      );
      assertEqual( 
        'a b c d e...', 
        render("{{ 'a b c d e f g h i j k l m n o p q r s t u v w x y z' | truncatewords:5 }}")
      );
    },

    "{{ string | truncatewords:5,'-' }}": function() {
      assertEqual( 
        'a b c d e-', 
        render("{{'a b c d e f g h i j k l m n o p q r s t u v w x y z'|truncatewords:5,'-'}}")
      );
      assertEqual( 
        'a b c d e-', 
        render("{{ 'a b c d e f g h i j k l m n o p q r s t u v w x y z' | truncatewords:5,'-' }}")
      );
    },
    
    "{{ string | strip_html }}": function() {
      assertEqual( 
        'hello bob', 
        render("{{'hello <b>bob</b>'|strip_html}}")
      );
      assertEqual( 
        'hello bob', 
        render("{{ 'hello <b>bob</b>' | strip_html }}")
      );
    },

    "{{ string | strip_newlines }}": function() {
      var src = "\nhello \nbob \n\nold\n friend\n";
      assertEqual( 
        'hello bob old friend',
        render("{{src|strip_newlines}}", {src:src})
      );
      assertEqual( 
        'hello bob old friend',
        render("{{ src | strip_newlines }}", {src:src})
      );
    },
    
    "{{ collection | join }}": function() {
      assertEqual( "1 2 3", render("{{(1..3)|join}}") );
      assertEqual( "1 2 3", render("{{ (1..3) | join }}") );
    },

    "{{ collection | join:',' }}": function() {
      assertEqual( "1,2,3", render("{{(1..3)|join:','}}") );
      assertEqual( "1,2,3", render("{{ (1..3) | join:',' }}") );
    },

    "{{ collection | sort }}": function() {
      assertEqual( "1,2,3", render("{{c|sort}}", {c:[2,1,3]}) );
      assertEqual( "1,2,3", render("{{ c | sort }}", {c:[2,1,3]}) );
      assertEqual( "1,2,3", render("{{(1..3)|sort}}") );
      assertEqual( "1,2,3", render("{{ (1..3) | sort }}") );
    },

    "{{ collection | reverse }}": function() {
      assertEqual( "3,2,1", render("{{(1..3)|reverse}}") );
      assertEqual( "3,2,1", render("{{ (1..3) | reverse }}") );
      assertEqual( "3,2,1", render("{{c|reverse}}", {c:[1,2,3]}) );
      assertEqual( "3,2,1", render("{{ c | reverse }}", {c:[1,2,3]}) );
    },

    "{{ string | relace:string }}": function() {
      assertEqual( "bnns", render("{{'bananas'|replace:'a'}}") );
      assertEqual( "bnns", render("{{ 'bananas' | replace:'a' }}") );
    },

    "{{ string | relace_first:string }}": function() {
      assertEqual( "bnanas", render("{{'bananas'|replace_first:'a'}}") );
      assertEqual( "bnanas", render("{{ 'bananas' | replace_first:'a' }}") );
    },

    "{{ string | newline_to_br }}": function() {
      var src = "Hello,\nHow are you?\nI'm glad to here it."
      var exp = "Hello,<br/>\nHow are you?<br/>\nI'm glad to here it."
      assertEqual( exp, render("{{src|newline_to_br}}", {src:src}) );
      assertEqual( exp, render("{{ src | newline_to_br }}", {src:src}) );
    },
    
    "{{ 'now' | date:'format' }}": function() { // Duplicates issue #1 from github
      var exp = (new Date()).getFullYear();
      assertEqual( exp, render("{{'now' | date: '%Y'}}", {}) );
    },

    "{{ date | date:'format' }}": function() {
      var src = new Date('8/30/2008'),
          exp = "08.30.2008",
          fmt = "%m.%d.%Y";
      assertEqual( exp, render("{{src|date:'%m.%d.%Y'}}", {src:src, fmt:fmt}) );
      assertEqual( exp, render("{{ src | date:'%m.%d.%Y' }}", {src:src, fmt:fmt}) );
      assertEqual( exp, render("{{src|date:fmt}}", {src:src, fmt:fmt}) );
      assertEqual( exp, render("{{ src | date:fmt }}", {src:src, fmt:fmt}) );
    },

    "{{ collection | first }}": function() {
      assertEqual( "1", render("{{(1..3)|first}}") );
      assertEqual( "1", render("{{ (1..3) | first }}") );
      assertEqual( "1", render("{{c|first}}", {c:[1,2,3]}) );
      assertEqual( "1", render("{{ c | first }}", {c:[1,2,3]}) );
    },

    "{{ collection | last }}": function() {
      assertEqual( "3", render("{{(1..3)|last}}") );
      assertEqual( "3", render("{{ (1..3) | last }}") );
      assertEqual( "3", render("{{c|last}}", {c:[1,2,3]}) );
      assertEqual( "3", render("{{ c | last }}", {c:[1,2,3]}) );
    },
    
    note3: "Testing tags...",
    
    "{% assign varname = value %}": function() {
      var tmpl = Liquid.parse("{% assign myVar = 'VALUE' %}");
      tmpl.render({});
      assertEqual('VALUE', tmpl.lastContext.get('myVar'))

      tmpl = Liquid.parse("{% assign myVar = 10 %}");
      tmpl.render({});
      assertEqual(10, tmpl.lastContext.get('myVar'))

      tmpl = Liquid.parse("{% assign myVar = 5.5 %}");
      tmpl.render({});
      assertEqual(5.5, tmpl.lastContext.get('myVar'))

      tmpl = Liquid.parse("{% assign myVar = (1..3) %}");
      var results = tmpl.render({});
      assertEqual("1,2,3", tmpl.lastContext.get('myVar'))

      // Also make sure that nothing leaks out...
      assertEqual("", results);
    },
    
    // "{% cache varname %} content {% endcache %}": function() {
    //   var src = "{% cache myContent %} Good 'old content! {% endcache %}",
    //       tmpl = Liquid.parse(src),
    //       result = tmpl.render({});
    //   assertEqual("", result);
    //   assertEqual(" Good 'old content! ", tmpl.lastContext.get('myContent'))
    // },
    
    "{% capture varname %} content {% endcapture %}": function() {
      var src = "{% capture myContent %}Good 'old content!{% endcapture %}Before {{ myContent }}",
          tmpl = Liquid.parse(src),
          result = tmpl.render({});
      assertEqual("Before Good 'old content!", result);
      assertEqual("Good 'old content!", tmpl.lastContext.get('myContent'))
    },

    "{% case conditionLeft %} {% when conditionRight %} {% else %} {% endcase %}": function() {
      var src = "{% case testVar %}\n\
{% when 1 %} One!\
{% when 2 %} Two!\
{% when 'test' %} Test!\
{% else %} Got me{% endcase %}",
          tmpl = Liquid.parse(src);

      assertEqual(" One!", tmpl.render({ testVar:1 }));
      assertEqual(" Two!", tmpl.render({ testVar:2 }));
      assertEqual(" Test!", tmpl.render({ testVar:'test' }));
      assertEqual(" Got me", tmpl.render({ testVar:null }));
      assertEqual(" Got me", tmpl.render({ }));
    },
    
    "{% comment %} content {% endcomment %}": function() {
      assertEqual("", render("{% comment %} I'm a comment! {% endcomment %}"))
    },
    
    "{% cycle 'odd', 'even' %}": function() {
      var src = "{% cycle 'odd', 'even' %} {% cycle 'odd', 'even' %} {% cycle 'odd', 'even' %}";
      assertEqual('odd even odd', render(src));

      var src = "{% cycle 'odd', 'even' %}{% cycle 'odd', 'even' %}{% cycle 'odd', 'even' %}";
      assertEqual('oddevenodd', render(src));
    },

    "{% for item in collection %}{% endfor %}": function() {
      assertEqual("123", render("{% for item in (1..3) %}{{ item }}{% endfor %}"));
      assertEqual(" 1  2  3 ", render("{% for item in (1..3) %} {{ forloop.index }} {% endfor %}"));
      assertEqual(" 0  1  2 ", render("{% for item in (1..3) %} {{ forloop.index0 }} {% endfor %}"));
      assertEqual(" true  false  false ", render("{% for item in (1..3) %} {{ forloop.first }} {% endfor %}"));
      assertEqual(" false  false  true ", render("{% for item in (1..3) %} {{ forloop.last }} {% endfor %}"));
      // TODO: Add test for the rest of the forloop variables too...
    },

    "{% if conditions %}{% else %}{% endif %}": function() {
      assertEqual("TRUE", render("{% if true %}TRUE{% endif %}"))
      assertEqual("TRUE", render("{% if 1 == 1 %}TRUE{% endif %}"))
      assertEqual("",     render("{% if 1 != 1 %}TRUE{% endif %}"))
      assertEqual("",     render("{% if 1 > 1 %}TRUE{% endif %}"))
      assertEqual("",     render("{% if 1 < 1 %}TRUE{% endif %}"))
      assertEqual("TRUE", render("{% if 1 <= 1 %}TRUE{% endif %}"))
      assertEqual("TRUE", render("{% if 1 >= 1 %}TRUE{% endif %}"))
      // Testing else as well...
      assertEqual("TRUE", render("{% if true %}TRUE{% else %}FALSE{% endif %}"))
      assertEqual("TRUE", render("{% if 1 == 1 %}TRUE{% else %}FALSE{% endif %}"))
      assertEqual("FALSE",render("{% if 1 != 1 %}TRUE{% else %}FALSE{% endif %}"))
      assertEqual("FALSE",render("{% if 1 > 1 %}TRUE{% else %}FALSE{% endif %}"))
      assertEqual("FALSE",render("{% if 1 < 1 %}TRUE{% else %}FALSE{% endif %}"))
      assertEqual("TRUE", render("{% if 1 <= 1 %}TRUE{% else %}FALSE{% endif %}"))
      assertEqual("TRUE", render("{% if 1 >= 1 %}TRUE{% else %}FALSE{% endif %}"))
    },

    "{% ifchanged %}{% endifchanged %}": function() {
      assertEqual("12", render("{% for item in col %}{% ifchanged %}{{ item }}{% endifchanged %}{% endfor %}", {col:[1,1,1,2,2,2]}));
    },

    "{% include 'templateName' %}": function() {
      Liquid.readTemplateFile = function(path) {
        if(path == 'simple')
          return "simple INCLUDED!";
        else
          return "{{ data }} INCLUDED!";
      }
      assertEqual("simple INCLUDED!", render("{% include 'simple' %}"))
      assertEqual("Data INCLUDED!", render("{% include 'variable' with data:'Data' %}"))
    },

    "{% unless conditions %}{% else %}{% endunless %}": function() {
      assertEqual("",     render("{% unless true %}TRUE{% endunless %}"))
      assertEqual("",     render("{% unless 1 == 1 %}TRUE{% endunless %}"))
      assertEqual("TRUE", render("{% unless 1 != 1 %}TRUE{% endunless %}"))
      assertEqual("TRUE", render("{% unless 1 > 1 %}TRUE{% endunless %}"))
      assertEqual("TRUE", render("{% unless 1 < 1 %}TRUE{% endunless %}"))
      assertEqual("",     render("{% unless 1 <= 1 %}TRUE{% endunless %}"))
      assertEqual("",     render("{% unless 1 >= 1 %}TRUE{% endunless %}"))
      // Testing else as well...
      assertEqual("FALSE", render("{% unless true %}TRUE{% else %}FALSE{% endunless %}"))
      assertEqual("FALSE", render("{% unless 1 == 1 %}TRUE{% else %}FALSE{% endunless %}"))
      assertEqual("TRUE",  render("{% unless 1 != 1 %}TRUE{% else %}FALSE{% endunless %}"))
      assertEqual("TRUE",  render("{% unless 1 > 1 %}TRUE{% else %}FALSE{% endunless %}"))
      assertEqual("TRUE",  render("{% unless 1 < 1 %}TRUE{% else %}FALSE{% endunless %}"))
      assertEqual("FALSE", render("{% unless 1 <= 1 %}TRUE{% else %}FALSE{% endunless %}"))
      assertEqual("FALSE", render("{% unless 1 >= 1 %}TRUE{% else %}FALSE{% endunless %}"))
    }
  }
})();