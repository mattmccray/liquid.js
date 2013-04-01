Liquid.Template.registerFilter

  date: (input, format, locale)->
    date= if input instanceof Date
        input 
      else if input is 'now'
        new Date() 
      else
        new Date(input)
    date= new Date(Date.parse(input)) unless date instanceof Date
    if date instanceof Date
      strftime(format, date, locale)
    else
      input 