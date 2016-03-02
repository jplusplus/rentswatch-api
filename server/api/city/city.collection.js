'use strict';

var _ = require('lodash'),
 slug = require('slug'),
 path = require('path'),
    Q = require('q'),
 docs = require('../doc/doc.model'),
  Set = require("collections/set");
// Gets cities list from the config file
var cities = require('../../config/cities.json');
// Create an empty set collection
var collection = new Set([],
  // Uniqueness is obtain by comparing name
  function (a, b) {
    return slug(a.name).toLowerCase() === slug(b.name).toLowerCase();
  },
  function (object) {
    return slug(object.name).toLowerCase();
  }
);

var bind = function(fn, obj) {
  return function() {
    return fn.apply(obj, arguments);
  }
}

var getStats = function() {
  var deferred = Q.defer();
  var city = this;
  // Get center according to the request
  docs.centeredDecades(city.latitude, city.longitude, city.radius).then(function(decades) {
    var stats = { decades: decades };
    // Extracting slope...
    docs.losRegression(city.latitude, city.longitude, city.radius).then(function(slope) {
      stats.slope = slope;
      // Timestamp of the last snapshot
      stats.lastSnapshot =  ~~(Date.now()/1e3)
      // Calculates the total number of docs
      stats.total = _.reduce( _.pluck(decades, 'count'), function(sum, c) {
        return sum + c;
      }, 0);
      // Resolve the promise
      deferred.resolve(stats);
    });
  });
  // Return a promise
  return deferred.promise;
};

// Add every cities, one by one, to the collection
for(var i in cities) {
  // Current city...
  var city = cities[i];
  // Create a slug
  city.slug = slug(city.name).toLowerCase()
  // Each city has is own method to get stats.
  // We use the bind method to ensure that the context of this function
  // is always the current city.
  city.getStats = bind(getStats, city);
  // Get cached data about this city
  var filename = path.join('../../cache/cities', city.slug + '.json');
  try {
    // Extend the current city object with the cached data
    _.extend(city, require(filename));
  } catch (e) {
    console.error(">> The city %s doesnt have valid cached data.", city.name);
  }
  // Add
  // Finaly, add the city to the collection
  collection.add(city);
}
// Expose the collection
module.exports = collection;
