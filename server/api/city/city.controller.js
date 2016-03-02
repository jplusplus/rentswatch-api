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
  res.json(200,  {});
};
