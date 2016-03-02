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
  // Help to extract a uniq key by month for the given row
  var getMonthKey = function(row) {
    var date  = new Date(row.created_at);
    var month = "0" + (date.getMonth() + 1)
    return date.getFullYear() + '-' + month.substr(month.length - 2)
  };
  // Create statistic for the given rows set
  var getFullStats = function(rows) {
    return {
      // Extract number of documents
      total: rows.length,
      // Extract the slope for the given rows
      avgPricePerSqm: 1/docs.extractSlope(rows),
      // Timestamp of the last snapshot
      lastSnapshot:  ~~(Date.now()/1e3),
      // Caculate std for this area
      stdErr: math.std( _.map(rows, 'total_rent') ),
    };
  };
  var deferred = Q.defer();
  var city = this;
  // Extracting slope...
  docs.center(city.latitude, city.longitude, city.radius).then(function(rows) {
    // Colect full statistics about this row
    var stats = getFullStats(rows);
    // Groups rows by month
    stats.months = _.chain(rows)
      // Use a custom function to obtain the key
      .groupBy(getMonthKey)
      // Filter to month with more than 5 rows
      .filter(function(rows) { return rows.length >= 5; })
      // Colect full statistics grouped on every month
      .map(function(rows) {
        return _.extend(
          // Create the key with the first rows (they all have the same)
          { month: getMonthKey(rows[0]) },
          // Merge objects
          getFullStats(rows)
        );
      })
      // Sort by month key
      .sortBy('month').value();    
    // Resolve the promise
    deferred.resolve(stats);
  // Request failed
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
