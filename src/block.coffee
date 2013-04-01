
class Liquid.Block extends Liquid.Tag

  TAG_OPEN= /^\{\%/
  TAG_PARTS= /^\{\%\s*(\w+)\s*(.*)?\%\}$/
  
  VAR_OPEN= /^\{\{/
  VAR_PARTS= /^\{\{(.*)\}\}$/

  constructor: (tagName, markup, tokens)->
    @blockName= tagName
    @blockDelimiter= "end#{ @blockName }"
    super tagName, markup, tokens

  parse: (tokens)->
    @nodelist ?= []
    # @nodelist.length = 0 # TODO: Remove this and see if any tests fail

    token= tokens.shift()
    tokens.push ''

    while tokens.length

      if TAG_OPEN.test token
        tag_parts= token.match TAG_PARTS
        throw new Error( "Tag '#{token}' was not properly terminated with '%}'") unless tag_parts?
        [_, tag, content]= tag_parts

        if tag is @blockDelimiter
          # if we found the proper block delimitor just end parsing here 
          # and let the outer block proceed
          return @endTag()

        if objectHasKey Liquid.Template.tags, tag
          @nodelist.push new Liquid.Template.tags[tag]( tag, content, tokens )
        
        else
          @unknownTag( tag, content, tokens )

      else if VAR_OPEN.test token
        @nodelist.push @createVariable(token)

      else
        @nodelist.push token

      token= tokens.shift()

  endTag: -> #NOOP

  unknownTag: (tag, params, tokens)->
    msg= switch tag
      when 'else' then "#{@blockName} tag does not expect else tag"
      when 'end' then "'end' is not a valid delimiter for #{@blockName} tags. use #{@blockDelimiter}"
      else "Unknown tag: #{tag}"
    throw new Error(msg)

  createVariable: (token)->
    match= token.match VAR_PARTS
    if match?
      new Liquid.Variable(match[1])
    else
      throw new Error("Variable '#{token}' was not properly terminated with: }}")

  render: (context)->
    @renderAll @nodelist, context

  renderAll: (list=[], context={})->
    output=[]
    for token in list
      content= try # TODO: Possibly remove the try/catch? Move up?
          token.render?(context) ? token
        catch e
          context.handleError?(e) ? String(e)
      output.push content
    output

  assertMissingDelimitation: ->
    throw new Error("#{blockName} tag was never closed")

