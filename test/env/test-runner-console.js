/*
  = Test Framework
    version 1.1

  This is a simple JavaScript test framework designed for using with Rhino.

  = TODO:

   * Add support for calling Tests.setup() and Tests.teardown()
   * Documentation!
*/

// We're gonna run all this in it's own scope so it doesn't pollute the test namespace
(function(){
  var title       = "Test Cases",
      auto_test   = false,
      desc        = "",
      execList    = [],
      methodList  = [];
  
  function Note(msg) {
    this.type = 'note';
    this.content = msg;
    this.execute = function() {
//      print( this.content );
    };
  }
  
  function TestRunner(name, func) {
    this.type = 'test';
    this.name = name;
    this.method = func;
    this.execute = function() {
      this.method.call(Tests)
    };
  }
  
  function printHeader() {
    print(title);
    if(desc) print(desc);
    print("");
  }
  
  if( typeof(Tests) != 'undefined' ) {
    if(Tests.title)       title     = Tests.title;
    if(Tests.description) desc      = Tests.description;
    if(Tests.auto_test)   auto_test = Tests.auto_test;

    // Clean 'em up...
    delete Tests['title'];
    delete Tests['description'];
    delete Tests['auto_test'];

    for(func in Tests) {
      if (/^note/.test(func)) {
        execList.push( new Note( Tests[func] ) );
      } else { //   if(/^test/.test(func)) {
        execList.push( new TestRunner(func, Tests[func]) );
      }
    }

    printHeader();
    //runTests();

  } else {
    printHeader();
    print('No tests defined!');
  }

  window.assertionCount = 0;
  window.assertionFailCount = 0;
  window.assertionErrorCount = 0;
  window.assertionFailures = [];
  window.errors = [];
  
  // Exported functions
  window.runAllTests = function() {
    var errors = [];
    window.assertionCount = 0;
    window.assertionFailCount = 0;
    
    forEach(execList, function(tr){
      assertionFailures = [];
      assertionExceptions = [];
//      print(" - "+ tr.name);
      
      try {
        tr.execute()
      } catch (ex) {
        assertionErrorCount++;
        assertionExceptions.push(ex)
      }
      
      if( assertionFailures.length == 0 && assertionExceptions.length == 0) {
//        print("√ "+ tr.name);
        print(".");
        
      } else {
        print("X "+ tr.name);
        var results = []
        
        forEach(assertionFailures, function(err){
          results.push( "  "+ err.assertionType +":"+ (err.message || err.extraInformation) );
        });
        
        forEach(assertionExceptions, function(err){
          results.push( "  Error:"+ (err.description || err.message || err) );
        });
        
        print( results.join('\n') );
      }
    });
  }
  
// Assertions
  window.assert = function(condition, msg) {
    window.assertionCount++;
    if(!condition) {
      ex = 'true was expected, but value was '+ condition;
      assertError(msg, 'assert', ex);
    }
  }

  window.assertFalse = function(condition, msg) {
    window.assertionCount++;
    if(condition) {
      ex = 'false was expected, but value was '+ condition;
      assertError(msg, 'assertFalse', ex);
    }
  }

  window.assertNull = function(condition, msg) {
    window.assertionCount++;
    if(null != condition) {
      ex = 'null was expected, but value was '+ condition;
      assertError(msg, 'assertNull', ex);
    }
  }

  window.assertNotNull = function(condition, msg) {
    window.assertionCount++;
    if(null == condition) {
      ex = 'null was not expected, but value was '+ condition;
      assertError(msg, 'assertNotNull', ex);
    }    
  }

  window.assertEqual = function(condition1, condition2, msg) {
    window.assertionCount++;
    ex = condition1 +' was expected, but value was '+ condition2;
    if(condition1 != condition2) {
      assertError(msg, 'assertEqual', ex);
    }
  }
  
  window.assertNotEqual = function(condition1, condition2, msg) {
    window.assertionCount++;
    if(condition1 == condition2) {
      ex = condition1 +' was not expected, but value was '+ condition2;
      assertError(msg, 'assertNotEqual', ex);
    }
  }
  
  window.assertUndefined = function(object, msg) {
    window.assertionCount++;
    if(object != 'undefined' ) {
      ex = object +' was defined';
      assertError(msg, 'assertUndefined', ex);
    }
  }

  window.assertDefined = function(object, msg) {
    window.assertionCount++;
    if(object == 'undefined' ) {
      ex = object +' was undefined';
      assertError(msg, 'assertDefined', ex);
    }
  }
  
// Private functions
  function $(elem) {
    return document.getElementById(elem);
  }
  
  function log() {
    var msg = [];
    forEach(arguments, function(arg){ msg.push( arg || '' ); });
    if(window.console && window.console.log) {
      window.console.log(msg.join(' '))
    } else if(window.console && window.console.info) {
      window.console.info(msg.join(' '))
    } else if(print) {
      print(msg);
    }
  }
  
  function forEach(array, block, context) {
      for (var i = 0; i < array.length; i++) {
        block.call(context, array[i], i, array);
      }
  }
  
  
  function assertError(errorMessage, assertionType, extraInfo) {
    window.assertionFailCount++;
    assertionFailures.push({
      assertionType: assertionType,
      message: errorMessage,
      extraInformation: extraInfo.toString().replace(/</g, '&lt;'),
      description: errorMessage +"\n"+ extraInfo.toString().replace(/</g, '&lt;')
    });
  }


})();

runAllTests();
