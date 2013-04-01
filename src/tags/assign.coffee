
class AssignTag extends Liquid.Tag
  tagSyntax= /((?:\(?[\w\-\.\[\]]\)?)+)\s*=\s*((?:"[^"]+"|'[^']+'|[^\s,|]+)+)/
  
  constructor: (tag, markup, tokens)->
    parts= markup.match tagSyntax
    throw new Error("Syntax error in 'assign' - Valid syntax: assign [var] = [source]") unless parts?
    [_, @to, @from]= parts
    super tag, markup, tokens

  render: (ctx)->
    arrayLast(ctx.scopes)[@to]= ctx.get @from
    ""

Liquid.Template.registerTag 'assign', AssignTag
