
class Liquid.Template

  TOKENIZER= /(\{\%.*?\%\}|\{\{.*?\}\}?)/

  constructor: ->
    @root= null
    @registers= {}
    @assigns= {}
    @errors= []
    @rethrowErrors= no

  parse: (src)->
    @root= new Liquid.Document( @constructor.tokenize(src) )
    @

  render: ->
    return '' unless @root?
    args=
      ctx: arguments[0]
      filters: arguments[1]
      registers: arguments[2]
    context= null

    if args.ctx instanceof Liquid.Context
      context= args.ctx
      @assigns= context.assigns
      @registers= context.registers
    else
      objectExtend @assigns, args.ctx if args.ctx?
      objectExtend @registers, args.registers if args.registers?
      context= new Liquid.Context @assigns, @registers, @rethrowErrors

    context.addFilters args.filters if args.filters?

    try
      results= @root.render(context).join('')
    finally
      @errors= context.errors

    results

  renderWithErrors: ->
    oldErrorVal= @rethrowErrors
    @rethrowErrors= yes
    results= @render.apply @, arguments
    @rethrowErrors= oldErrorVal
    results

  @tags= {}

  @registerTag: (name, cls)->
    # console.log name, cls
    @tags[name]= cls
    # console.log @tags
    @

  @registerFilter: (filters)->
    Liquid.Strainer.registerFilters filters
    @

  @registerFilters: @registerFilter

  @tokenize: (src)->
    tokens= src.split TOKENIZER
    # removes the rogue empty element at the beginning of the array
    tokens.shift() if tokens[0] is ''
    # console.log("Source tokens:", tokens)
    tokens

  @parse: (src)->
    new @().parse(src)