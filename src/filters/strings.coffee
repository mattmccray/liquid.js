escape_str= (input)->
  input.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

truncate_words= (input, words='15', string='...')->
    return '' unless input? and input isnt ''
    words = parseInt(words, 10);
    wordlist = input.toString().split(" ")
    l = Math.max(words, 0)
    if wordlist.length > l
      wordlist.slice( 0, l).join(' ') + string
    else
      input


Liquid.Template.registerFilter

  downcase: (input)->
    input.toString().toLowerCase()
  
  upcase: (input)->
    input.toString().toUpperCase()
  
  capitalize: (input)->
    stringCapitalize input    

  replace: (input, string, replacement='')->
    input.toString().replace(new RegExp(string, 'g'), replacement)
  
  replace_first: (input, string, replacement='')->
    input.toString().replace(new RegExp(string, ""), replacement)
  
  escape: escape_str

  h: escape_str

  truncate: (input, length=50, string="...")->
    return '' unless input? and input isnt ''
    seg = input.slice(0, length)
    if input.length > length 
      input.slice(0, length) + string
    else 
      input
  
  truncatewords: truncate_words

  truncate_words: truncate_words
  
  strip_html: (input)->
    input.toString().replace(/<.*?>/g, '')
  
  strip_newlines: (input)->
    input.toString().replace(/\n/g, '')

  newline_to_br: (input)->
   input.toString().replace(/\n/g, "<br/>\n")
  