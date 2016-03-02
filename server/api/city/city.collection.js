'use strict';

var _ = require('lodash'),
 slug = require('slug'),
 path = require('path'),
  Set = require("collections/set");
// Gets cities list from the config file
var cities = require('../../config/cities.json');
// Create an empty set collection
var collection = new Set([],
  // Uniqueness is obtain by comparing name
  function (a, b) {
    return a.name === b.name;
  },
  function (object) {
    return object.name;
  }
);

// Add every cities, one by one, to the collection
for(var i in cities) {
  // Current city...
  var city = cities[i];
  // Create a slug
  city.slug = slug(city.name).toLowerCase()
  // Get cached data about this city
  var filename = path.join('../../cache/cities', city.slug + '.json');
  try {
    // Extend the current city object with the cached data
    _.extend(city, require(filename));
  } catch (e) {
    console.error(">> The city %s doesnt have valid cached data.", city.name);
  }

  // Finaly, add the city to the collection
  collection.add(city);
}
// Expose the collection
module.exports = collection;
