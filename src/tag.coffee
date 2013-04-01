class Liquid.Tag

  constructor: (@tagName, @markup, tokens)->
    @nodelist ?= []
    @parse tokens

  parse: (tokens)-> # Noop

  render: (context)-> ""