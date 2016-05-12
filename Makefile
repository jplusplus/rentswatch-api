install:
	npm install
	bower install
	make doc
	
doc:
	grunt apidoc

run:
	grunt serve

build:
	grunt build --force

deploy: build
	heroku docker:release -a rentswatch-api

prefetch:
	node server/commands/prefetch.js
