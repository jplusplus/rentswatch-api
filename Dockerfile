# Inherit from Heroku's stack
FROM heroku/nodejs
MAINTAINER pirhoo <hello@pirhoo.com>

# Internally, we arbitrarily use port 3000
ENV PORT 3000
# Which version of node?
ENV NODE_ENGINE 0.10.41
ENV NODE_ENV production
ENV ENV 
