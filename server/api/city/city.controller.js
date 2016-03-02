'use strict';

var _ = require('lodash');

var response = require("../response"),
   paginator = require("../paginator");

var cities = require('./city.collection');

// Get list of cities
exports.index = function(req, res) {
  // Build paginator parameters
  var params = paginator.offset(req);
  // Return a slice of the collections
  res.json(200, cities.toArray().slice(params.offset, params.offset + params.limit) );
};

// Get a city by its name
exports.show = function(req, res) {
  var city = cities.get({ name: req.params.name });
  if(city) {
    res.json(200, city);
  } else {
    response.handleError(res, 404)('Not found');
  }
};
