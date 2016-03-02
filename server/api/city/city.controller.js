'use strict';

var _ = require('lodash');

var response = require("../response"),
   paginator = require("../paginator");

var cities = require('./city.collection');

var INDEX_EXCLUDE = ['decade'];

// Get list of cities
exports.index = function(req, res) {
  // Build paginator parameters
  var params = paginator.offset(req);
  // Maps the cities array to remove some properties
  res.json(200, _.map(cities.toArray(), function(city) {
    city = _.cloneDeep(city);
    // Delete some properties
    INDEX_EXCLUDE.forEach(function(k) { delete city[k] });
    return city;
  // Return a slice of the collections
  }).slice(params.offset, params.offset + params.limit) );
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
