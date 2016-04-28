#!/usr/bin/env node
'use strict';
// Load .env files (if needed)
require('../env')();

var fs = require('fs'),
 async = require('async'),
  path = require('path'),
  slug = require('slug'),
  argv = require('yargs').usage('Usage: $0 -c [city]').alias('c', 'city').argv;
// Cities collection
var cities = require("../api/city/city.collection");

// Collect promises for each city
async.eachSeries(cities.toArray(), function(city, callback) {
  if(!argv.city || slug(argv.city).toLowerCase() === slug(city.name).toLowerCase() ) {
    return city.getStats().then(function(stats) {
      var output = path.join(__dirname, '..', 'cache', 'cities', city.slug + '.json');
      // Write stats for this city
      fs.writeFile(output, JSON.stringify(stats, null, 2),  function(err) {
        if(err) {
          console.error(">> [ERROR] %s not saved: %s", city.name, err);
          callback(err, null);
        } else {
          console.log(">> [SUCCESS] %s saved to %s", city.name, output);
          // Return the output file as promise result
          callback(null, output);
        }
      });
    }, callback).fail(callback);
  } else {
    callback(null, null);
  }
// When all promises are resolved we stop the program
}, function(err) {
  // Print out errors
  if(err) console.error(err);
  process.exit()
});
