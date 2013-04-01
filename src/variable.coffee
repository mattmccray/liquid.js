class Liquid.Variable

  VARIABLE= /\s*("[^"]+"|'[^']+'|[^\s,|]+)/
  FILTERS= /\|\s*(.*)/
  WORDS= /\s*(\w+)/
  FILTER_PARTS= /(?:[:|,]\s*)("[^"]+"|'[^']+'|[^\s,|]+)/g
  FILTER_CLEANUP= /^[\s|:|,]*(.*?)[\s]*$/

  # TODO: Clean up this mess...
  constructor: (@markup)->
    @name= null
    @filters= []
    match= @markup.match VARIABLE
    if match?
      @name= match[1]
      filter_matches= markup.match FILTERS
      if filter_matches?
        filters= filter_matches[1].split '|' # was /\|/, why?
        for filter in filters
          matches= filter.match WORDS
          if matches?
            name= matches[1]
            args= []
            parts= filter.match(FILTER_PARTS) ? []
            for arg in parts
              cleaned= arg.match FILTER_CLEANUP
              if cleaned?
                args.push cleaned[1]
            @filters.push [name, args]

  render: (context)->
    return '' unless @name?
    output= context.get @name
    for [name, args] in @filters
      args= arrayMap args, (arg)-> context.get(arg)
      args.unshift output
      output= context.invoke name, args
    output
      
    