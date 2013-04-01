class Liquid.Strainer

  constructor: (@context)->
    # for filter, fn of @constructor.filters
    #   @[filter]= fn
    
  respondTo: (method)->
    return no if type(method) isnt 'string'
    return no if method[0] is '_'
    return no if arrayHasItem @constructor.requiredMethods, method
    objectHasKey this, method

  execute: (method, args)->
    # This is ever actually called?
    @[method].apply @, args

  # @filters: {}
  @requiredMethods: ['respondTo', 'context']

  @registerFilter: (filters)->
    for filter, fn of filters
      # @filters[filter]= fn
      @::[filter]= fn
    @
  @registerFilters: @registerFilter
  @globalFilter: @registerFilter

  @create: (context)->
    new @(context)
