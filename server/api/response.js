'use strict';

var crypto = require("crypto"),
     cache = require('../cache');

module.exports.validationError = function(res, statusCode) {
  statusCode = statusCode || 422;
  return function(err) {
    res.json(statusCode, err);
  };
};

module.exports.handleError = function(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.send(statusCode, err);
  };
}

module.exports.respondWith = function(res, statusCode) {
  statusCode = statusCode || 200;
  return function() {
    res.send(statusCode);
  };
}

var setCachedRequest = module.exports.setCachedRequest = function(req, value, callback, duration) {
  // Default duration of 2000 ms
  duration = duration || 2000;
  try {
    var key = requestKey(req);
    // Save the value
    cache.set( key, value, callback, duration);
  } catch(e) {
    console.error("Unable to cache %s", key);
  }
};

var requestKey = module.exports.requestKey = function(req) {
  // Get request argument to create a unique hash object
  var hash = JSON.stringify([ req.baseUrl + "/" + req.path, req.params, req.query ]);
  // Create a cache key
  return "request_" + crypto.createHash("sha256").update(hash).digest('hex');
}

var cachedRequest = module.exports.cachedRequest = function(callback) {
  return function(req, res, next) {
    // Create a cache key
    var key = requestKey(req);
    // Proxy the real end function
    cache.get(key, function(err, value) {
      // Continue
      if(err || !value) next();
      // Send the value
      else callback(req, res, value);
    });
  };
};

var cachedJson = module.exports.cachedJson = function() {
  return cachedRequest(function(req, res, value) {
    res.status(201).json(value);
  });
};

var cachedPng = module.exports.cachedPng = function() {
  return cachedRequest(function(req, res, value) {
    res.type('image/png');
    res.status(201).end(value, 'binary');
  });
};

var cachedRedirect = module.exports.cachedRedirect = function() {
  return cachedRequest(function(req, res, value) {
    res.redirect(value);
  });
};
