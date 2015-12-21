Liquid.Variable = Liquid.Class.extend({

  init: function(markup) {
    this.markup = markup;
    this.name = null;
    this.filters = [];
    var self = this;
    var match = markup.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)/);
    if( match ) {
      this.name = match[1];
      var filterMatches = markup.match(/\|\s*(.*)/);
      if(filterMatches) {
        var filters = filterMatches[1].split(/\|/);
        Liquid.extensions.arrayTools.each(filters, function(f){
          var matches = f.match(/\s*(\w+)/);
          if(matches) {
            var filterName = matches[1];
            var filterArgs = [];
            Liquid.extensions.arrayTools.each(Liquid.extensions.arrayTools.flatten((f.match(/(?:[:|,]\s*)("[^"]+"|'[^']+'|[^\s,|]+)/g) || [])), function(arg){
              var cleanupMatch = arg.match(/^[\s|:|,]*(.*?)[\s]*$/);
              if(cleanupMatch)
                { filterArgs.push( cleanupMatch[1] );}
            });
            self.filters.push( [filterName, filterArgs] );
          }
        });
      }
    }
  },
  
  render: function(context) {
    if(this.name == null){ return ''; }
    var output = context.get(this.name);
    Liquid.extensions.arrayTools.each(this.filters, function(filter) {
      var filterName = filter[0],
          filterArgs = Liquid.extensions.arrayTools.map((filter[1] || []), function(arg){
            return context.get(arg);
          });
      filterArgs.unshift(output); // Push in input value into the first argument spot...
      output = context.invoke(filterName, filterArgs);
    });

    return output;
  }
});
