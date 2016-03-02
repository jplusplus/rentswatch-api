'use strict';

var join = require("path").join,
  exists = require('fs').existsSync;

module.exports = function() {
  // Path to the env file
  var env  = join(__dirname, '..', '.env');
  // Check that the env file exists
  if( exists(env) ) {
    // Load environement variables from .env
    require('dotenv').load({ path: env });
  }
  // Also load local env file in javascript
  var localConfig;
  try {
    localConfig = require('./config/local.env');
    for(var key in localConfig) {
      process.env[key] = localConfig[key];
    }
  } catch(e) { /* Silence is golden */}
  // Set default node environment to development
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
};
