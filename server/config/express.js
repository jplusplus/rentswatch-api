/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var _ = require('lodash');
var config = require('./environment');
var cors = require('cors');

module.exports = function(app) {
  var env = app.get('env');
  const TILES_HOST = 'https://s3-eu-west-1.amazonaws.com/rentswatch-api/';

  app.set('views', config.root + '/server/views');
  app.set('view engine', 'jade');
  // Get auth tokens
  app.set('auth_tokens', _.compact((process.env.AUTH_TOKENS || '').split(',') ));
  // Where should we find the tiles?
  app.set('tiles_host', process.env.TILES_HOST || TILES_HOST);

  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(cors());

  if ('production' === env) {
    app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }

  app.use(express.static(path.join(config.root, 'server/views/doc')));
  app.set('appPath', path.join(config.root, 'server/views/doc'));
};
