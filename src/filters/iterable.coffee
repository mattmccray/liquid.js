
Liquid.Template.registerFilter

  size: (arr)->
    arr.length ? 0

  join: (arr, sep=' ')->
    arr.join(sep)

  first: (arr)->
    arrayFirst(arr)

  last: (arr)->
    arrayLast(arr)

  sort: (arr)->
    arr.sort()

  reverse: (arr)->
    arr.reverse()
