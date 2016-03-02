#!/usr/bin/env node
'use strict';
// Load .env files (if needed)
require('../env')();

var Q = require('q'),
   fs = require('fs'),
 path = require('path');
// Cities collection
var cities = require("../api/city/city.collection");

// Collect promises for each city
var promises = cities.map(function(city) {
  return city.getStats().then(function(stats) {
    var output = path.join(__dirname, '..', 'cache', 'cities', city.slug + '.json');
    // Write stats for this city
    fs.writeFileSync(output, JSON.stringify(stats, null, 2));
    console.log(">> %s saved", city.name);
    // Return the output file as value
    return output;
  }).fail(console.error);
});

// When all promises are resolved we stop the program
Q.allSettled(promises).then(process.exit);
