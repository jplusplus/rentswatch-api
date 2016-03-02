'use strict';

var mysql = require('mysql');
var config = require('../config/environment');
// Export the MySQL connection
module.exports =  {
  mysql: mysql.createPool(config.mysql.uri)
};
