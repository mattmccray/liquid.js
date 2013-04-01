
class Liquid.Document extends Liquid.Block
  constructor: (tokens)->
    @blockDelimiter= [] #FIXME: Really?
    @parse tokens

  assertMissingDelimitation: -> # NOOP for Document