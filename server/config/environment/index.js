'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,
  // Root path of server
  root: path.normalize(__dirname + '/../../..'),
  // Server port
  port: process.env.PORT || 9000,
  // Server IP
  ip: process.env.IP || '0.0.0.0',
  // Should we populate the DB with sample data?
  seedDB: false,
  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'rentswatch-api-secret'
  },
  // MySQL connection options
  mysql: {
    uri: process.env.CLEARDB_DATABASE_URL ||
         process.env.DATABASE_URL ||
         'mysql://localhost/rentswatch'
  },
  // Memcached options (set to false to disable)
  memcached: {
    servers: process.env.MEMCACHIER_SERVERS || process.env.MEMCACHEDCLOUD_SERVERS,
    password: process.env.MEMCACHIER_PASSWORD || process.env.MEMCACHEDCLOUD_PASSWORD,
    username: process.env.MEMCACHIER_USERNAME || process.env.MEMCACHEDCLOUD_USERNAME
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(all, require('./' + process.env.NODE_ENV + '.js') || {});
