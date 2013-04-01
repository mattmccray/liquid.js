
Liquid=
  author: "Matt McCray"
  version: "2.0.1"

  readTemplateFile: (path)->
    throw new Error "This liquid context does not allow includes."

  registerFilters: (filters)->
    Liquid.Template.registerFilters filters

  parse: (src)->
    Liquid.Template.parse src

if window?
  window.Liquid= Liquid

else if module?
  module.exports= Liquid