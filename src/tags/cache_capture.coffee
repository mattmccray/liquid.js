class CaptureTag extends Liquid.Block
  tagSyntax= /(\w+)/

  constructor: (tagName, markup, tokens)->
    parts= markup.match(tagSyntax)
    throw ("Syntax error in '#{ tagName }' - Valid syntax: capture [var]") unless parts?
    @to= parts[1]
    super tagName, markup, tokens

  render: (context)->
    output = super(context)
    context.set @to, arrayFlatten([output]).join('') 
    ''


# Cache is just like capture, but it inserts into the root scope...
class CacheTag extends CaptureTag

  render: (context)->
    output = super(context)
    arrayLast(context.scopes)[@to]= arrayFlatten([output]).join('') 
    ''

Liquid.Template.registerTag 'cache', CacheTag
Liquid.Template.registerTag 'capture', CaptureTag
