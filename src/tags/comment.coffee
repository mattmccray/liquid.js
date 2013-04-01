class CommentTag extends Liquid.Block
  render: -> ''

Liquid.Template.registerTag 'comment', CommentTag