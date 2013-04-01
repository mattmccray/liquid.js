SRC=src/core.coffee \
	  src/helpers.coffee \
		src/tag.coffee \
		src/block.coffee \
		src/document.coffee \
		src/drop.coffee \
		src/context.coffee \
		src/strainer.coffee \
		src/variable.coffee \
		src/conditions.coffee \
		src/template.coffee
FILTERS=$(shell find src/filters -name "*.coffee")
TAGS=$(shell find src/tags -name "*.coffee") 

build:
	./node_modules/.bin/coffee -c -j liquid.tmp.js $(SRC) $(FILTERS) $(TAGS)
	cat liquid.tmp.js vendor/* > liquid.js
	rm liquid.tmp.js
	cat liquid.js | ./node_modules/.bin/uglifyjs -m > liquid.min.js

watch:
	./node_modules/.bin/coffee -w -c -j liquid.js $(SRC) $(FILTERS) $(TAGS)

test:
	@NODE_ENV=test
	@clear
	@./node_modules/.bin/mocha

clean:
	rm liquid.js
	rm liquid.min.js

.PHONY: build test clean
