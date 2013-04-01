class Liquid.Context
  TICK= /^'(.*)'$/
  QUOTE= /^"(.*)"$/
  INT= /^(\d+)$/
  FLOAT= /^(\d[\d\.]+)$/
  RANGE= /^\((\S+)\.\.(\S+)\)$/
  PART_PARSER= /\[[^\]]+\]|(?:[\w\-]\??)+/g
  SQUARE_PARSER= /^\[(.*)\]$/

  constructor: (assigns, registers, rethrowErrors)->
    assigns ?= {}
    @scopes= [assigns]
    @registers= registers ? {}
    @errors= []
    @rethrowErrors= rethrowErrors
    @strainer= new Liquid.Strainer(@)

  get: (key)->
    @resolve key

  set: (key, value)->
    @scopes[0][key]= value

  hasKey: (key)->
    @resolve(key)?

  push: ->
    scope= {}
    @scopes.unshift scope
    scope

  merge: (new_scope)->
    objectExtend @scopes[0], new_scope

  pop: ->
    throw new Error "Context stack error" if @scopes.length is 1
    @scopes.shift()

  stack: (block, ctx)->
    @push()
    ctx ?= @strainer
    try
      results= block.call ctx
    finally
      @pop()
    results

  invoke: (method, args)->
    if @strainer.respondTo(method)
      @strainer.execute(method, args)
    else
      if args.length is 0 then null else args[0]

  resolve: (key)->
    switch key
      when null, 'nil', 'null', '' then null
      when 'true' then true
      when 'false' then false
      when 'blank', 'empty' then ''
      else  
        @parseVariableType(key)

  parseVariableType: (key)->
    if TICK.test key
      key.replace TICK, '$1'

    else if QUOTE.test key
      key.replace QUOTE, '$1'

    else if INT.test key
      parseInt key.replace(INT, '$1'), 10

    else if FLOAT.test key
      parseFloat key.replace(FLOAT, '$1')

    else if RANGE.test key
      @createRange key

    else
      @variable key

  createRange: (key)->
    [range, l, r]= key.match RANGE
    left= parseInt(l, 10)
    right= parseInt(r, 10)
    arr= []

    if isNaN(left) or isNaN(right)
      left= l.charCodeAt(0)
      right= r.charCodeAt(0)
      limit= right - left + 1
      for i in [0...limit]
        arr.push String.fromCharCode( i + left )
    else
      limit= right - left + 1
      for i in [0...limit]
        arr.push i + left

    arr
      
  findVariable: (key)->
    for scope in @scopes
      if scope? and type(scope[key]) isnt 'undefined'
        variable= scope[key]
        if type(variable) is 'function'
          variable= variable.apply @
          scope[key]= variable
        if type(variable) is 'object'
          if objectHasKey variable, 'toLiquid'
            variable= variable.toLiquid()
          if objectHasKey variable, 'setContext'
            variable.setContext(@)
        return variable
    null
    
  variable: (markup)->
    return null if type(markup) isnt 'string'
    parts= markup.match PART_PARSER
    first_part= parts.shift()
    square_match= first_part.match SQUARE_PARSER

    if square_match?
      first_part= @resolve square_match[1]
    
    object= @findVariable first_part

    if object?
      for part in parts
        match= part.match SQUARE_PARSER
        if match?
          part= @resolve match[1]
          object= if type(object[part]) is 'function'
              object[part].apply(@)
            else
              object[part]
          # object[part]= object[part].apply(@) if type(object[part]) is 'function'
          # object= object[part]
          object= object.toLiquid() if type(object) is 'object' and objectHasKey object, 'toLiquid'
        else
          if type(object) is 'object' and objectHasKey object, part
            # if its a proc we will replace the entry in the hash table with the proc
            res = object[part]
            if type(res) is 'function'
              res= object[part]= res.apply(self)
            object= if type(res[part]) is 'object' and objectHasKey res[part], 'toLiquid'
                res[part].toLiquid()
              else
                res
          # Array
          else if (/^\d+$/).test(part)
            pos = parseInt(part, 10)
            if type(object[pos]) is 'function'
              object[pos] = object[pos].apply(@)
            object= if type(object[pos]) is 'object' and type(object[pos]) is 'object' and objectHasKey object[pos], 'toLiquid'
                object[pos].toLiquid()
              else 
                object[pos]

          # // Some special cases. If no key with the same name was found we interpret following calls
          # // as commands and call them on the current object if it exists
          else if object? and type(object[part]) is 'function' and arrayHasItem(['length', 'size', 'first', 'last'], part)
            object = object[part].apply(part)
            if objectHasKey object, 'toLiquid'
              object = object.toLiquid()

          # // No key was present with the desired value and it wasn't one of the directly supported
          # // keywords either. The only thing we got left is to return nil
          else
            return object= null
          
          if type(object) is 'object' and objectHasKey object, 'setContext'
              object.setContext(@)

    object

  addFilters: (filters)->
    filters= arrayFlatten(filters)
    for filter in filters
      if type(filter) isnt 'object'
        throw new Error("Expected object but got: #{ type filter }")
      objectExtend @strainer, filter    

  handleError: (err)->
    @errors.push err
    throw err if @rethrowErrors
    "Liquid error: #{ err.message ? err.description ? err }"
