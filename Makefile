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
	heroku container:push -a rentswatch-api

prefetch:
	rm -f server/cache/cities/*.json
	node server/commands/prefetch.js
