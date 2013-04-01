# A better typeof function
type= do ->
  toStr= Object::toString
  elemParser= /\[object HTML(.*)\]/
  classToType= {}

  for name in "Boolean Number String Function Array Date RegExp Undefined Null NodeList".split(" ")
    classToType["[object " + name + "]"] = name.toLowerCase()

  (obj) ->
    strType= toStr.call(obj)
    if found= classToType[strType]
      found
    else if found= strType.match(elemParser)
      found[1].toLowerCase()
    else
      "object"

# OBJECT HELPERS

objectHasKey= (object, key)-> 
  `(key in object)`

objectHasValue= (object, targetValue)->
  for key, value of object
    return yes if value is targetValue
  no
  
objectExtend= (object)->
  for source in Array::slice.call(arguments, 1)
    if source
      for key,value of source
        object[key]= value
  object

objectDefaults= (object)->
  for source in Array::slice.call(arguments, 1)
    if source
      for key,value of source
        unless object[key]?
          object[key]= value
        else if type(object[key]) is 'object'
          object[key]= objectDefaults {}, object[key], value
  object

# ARRAY HELPERS

arrayMap= do ->
  if Array::map?
    (array, fn, ctx)-> array.map(fn, ctx)
  else
    (array, fn, ctx)-> 
      results= []
      for item, i in array
        results.push fn.call ctx, item, i, ctx
      results

arrayFlatten= (array)->
  new_array= []
  for item in array
    if type(item) is 'array'
      sub_array= arrayFlatten(item)
      new_array= new_array.concat sub_array
    else
      new_array.push item
  new_array

arrayIndexOf= (array, targetItem)->
  if array.indexOf?
    array.indexOf(targetItem)
  else
    for item, i in array
      return i if item is targetItem
    -1

arrayHasItem= (array, targetItem)->
  arrayIndexOf(array, targetItem) > -1

arrayClear= (array)->
  array.length= 0

arrayFirst= (array)->
  array[0]

arrayLast= (array)->
  array[ array.length - 1 ]

# STRING HELPERS

stringTrim= do ->
  if String::trim?
    (str)-> str.trim()
  else
    (str)-> str.replace(stringTrim.RE_START, '').replace(stringTrim.RE_END, '')

stringTrim.RE_START= /^\s+/
stringTrim.RE_END= /^\s+$/

# not great
stringCapitalize= (str)->
  str.charAt(0).toUpperCase() + str.substring(1).toLowerCase()