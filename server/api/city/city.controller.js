'use strict';

var _ = require('lodash');

var response = require("../response"),
   paginator = require("../paginator");

var cities = require('./city.collection');

var INDEX_EXCLUDE = ['months', 'neighborhoods'];

// Get list of cities
exports.index = function(req, res) {
  // Build paginator parameters
  var params = paginator.offset(req);
  var list = cities.toArray().slice(params.offset, params.offset + params.limit);
  // Maps the cities array to remove some properties
  res.status(200).json(_.map(list, function(city) {
    city = _.cloneDeep(city);
    // Delete some properties
    INDEX_EXCLUDE.forEach(function(k) { delete city[k] });
    return city;
  // Return a slice of the collections
  }));
};

// Get a city by its name
exports.show = function(req, res) {
  var city = cities.get({ name: req.params.name });
  if(city) {
    res.status(200).json(city);
    /*city.getStats().then(function(stats) {
      city = _.extend( _.cloneDeep(city), stats);
      res.status(200).json(city);
    }).fail( response.handleError(res, 500) ); */
  } else {
    response.handleError(res, 404)('Not found');
  }
};
