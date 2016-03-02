#!/usr/bin/env node
'use strict';
// Load .env files (if needed)
require('../env')();

var fs = require('fs'),
 async = require('async'),
  path = require('path');
// Cities collection
var cities = require("../api/city/city.collection");
// Collect promises for each city
async.eachSeries(cities.toArray(), function(city, callback) {
  return city.getStats().then(function(stats) {
    var output = path.join(__dirname, '..', 'cache', 'cities', city.slug + '.json');
    // Write stats for this city
    fs.writeFileSync(output, JSON.stringify(stats, null, 2));
    console.log(">> %s saved", city.name);
    // Return the output file as value
    callback(null, output);
  }).fail(callback);
// When all promises are resolved we stop the program
}, process.exit)
