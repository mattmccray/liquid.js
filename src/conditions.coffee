class Liquid.Condition

  constructor: (@left, @operator, @right)->
    @childRelation= null
    @childCondition= null
    @attachment= null

  evaluate: (context)->
    context ?= new Liquid.Context()
    result= @interpretCondition @left, @right, @operator, context
    switch @childRelation
      when 'or' then result or @childCondition.evaluate(context)
      when 'and' then result and @childCondition.evaluate(context)
      else result

  or: (condition)->
    @childRelation= 'or'
    @childCondition= condition

  and: (condition)->
    @childRelation= 'and'
    @childCondition= condition

  attach: (attachment)->
    @attachment= attachment

  isElse: no # Feels hacky

  interpretCondition: (left, right, op, ctx)->
    return ctx.get left unless op?
    left= ctx.get left
    right= ctx.get right
    op= @constructor.operators[op]
    throw new Error("Unknown operator #{ op }") unless op?
    op(left, right)

  toString: ->
    "<Condition #{@left} #{@operator} #{@right}>"

  @operators:
    '==': (l,r)-> l is r
    '=':  (l,r)-> l is r
    '!=': (l,r)-> l isnt r
    '<>': (l,r)-> l isnt r
    '<':  (l,r)-> l < r
    '>':  (l,r)-> l > r
    '<=': (l,r)-> l <= r
    '>=': (l,r)-> l >= r

    contains: (l,r)-> arrayHasItem l, r
    hasKey: (l,r)-> objectHasKey l, r
    hasValue: (l,r)-> objectHasValue l, r


class Liquid.ElseCondition extends Liquid.Condition
  isElse: yes

  evaluate: -> yes

  toString: -> "<ElseCondition>"

