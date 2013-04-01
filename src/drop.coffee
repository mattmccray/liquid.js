class Liquid.Drop
  
  hasKey: (name)-> yes

  setContext: (@context)->

  beforeMethod: (method)-> null

  invokeDrop: (method)->
    results= @beforeMethod method

    unless results?    
      if objectHasKey @, method
        results= @[method].apply @

    results