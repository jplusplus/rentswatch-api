'use strict';

var config = require('../config/environment');

module.exports.offset = function(req) {
  return {
    offset: Math.max(0,  req.query.offset || 0),
    limit:  Math.min(200, req.query.limit  || 50)
  };
};

module.exports.page = function(req) {
  var limit = Math.min(200, req.query.limit  || 50);
  return {
    page:   Math.max(1,  (req.query.offset/limit) + 1 || 1),
    limit:  limit
  };
};
