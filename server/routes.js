/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');
var express = require('express');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/cities', require('./api/city'));
  app.use('/api/tiles', require('./api/tile'));
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*').get(errors[404]);
  // based route should redirect to the documentation
  app.get('/*', express.static(path.join(__dirname, 'views/doc/')));
};
