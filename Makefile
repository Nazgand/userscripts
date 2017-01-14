# vim: set noet ts=4 sw=4 :

NODE = node
ESLINT = $(NODE) ./node_modules/.bin/eslint

JS_FILES = ./bin/www $(shell find . -type f -name '*.js' ! -path './node_modules/*')

all: eslint
.PHONY: all

eslint:
	$(ESLINT) --ignore-pattern '!.eslintrc.js' $(JS_FILES)
.PHONY: eslint
