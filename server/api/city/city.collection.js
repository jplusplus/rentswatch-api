'use strict';

var _ = require('lodash'),
 slug = require('slug'),
 path = require('path'),
    Q = require('q'),
 math = require('mathjs'),
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
  // Flats arround a given place (if a radius is given) OR EVERY FLATS
  var getRowsFunc = city.radius ? 'center' : 'all';
  // Extracting slope...
  docs[getRowsFunc](city.latitude, city.longitude, city.radius).then(function(rows) {
    // Colect full statistics about this row
    var stats = docs.getStats(rows, city.radius, true);
    // Does the city have neighborhoods?
    if( (city.neighborhoods || []).length ) {
      // Get stats for every neighborhood
      city.neighborhoods.forEach(function(nh) {
        var filteredRows = docs.inRadius(rows, nh.latitude, nh.longitude, nh.radius);
        // Extend the nh object
        _.extend(nh,
          // With statistics about the neighborhood (without months details)
          docs.getStats(filteredRows, city.radius, false)
        );
      });
      // Add the new neighborhoods array to the stats
      stats.neighborhoods = city.neighborhoods;
    }
    // Extract deciles for this place
    docs.deciles(rows).then(function(deciles) {
      stats.deciles = deciles;
      // Resolve the promise
      deferred.resolve(stats);
    // Deciles request failed
    }, deferred.reject).fail(deferred.reject)
  // Rows request failed
  }, deferred.reject).fail(deferred.reject)
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
    // console.error(">> The city %s doesnt have valid cached data.", city.name);
  }
  // Add
  // Finaly, add the city to the collection
  collection.add(city);
}
// Expose the collection
module.exports = collection;
