#!/usr/bin/env node
'use strict';
// Load .env files (if needed)
require('../env')();

var fs = require('fs'),
     _ = require('lodash'),
   doc = require("../api/doc/doc.model"),
prompt = require('prompt'),
  argv = require('yargs').argv;

// Override prompt values with argv
prompt.override = argv
// Start the prompt
prompt.message = '';
prompt.delimiter = '';
prompt.start();

prompt.get([{
  name: 'output',
  type: 'string',
  default: 'stats.json',
  description: "Name of the ouput file:".magenta
}], function (err, params) {
  console.log("Extracting data...");
  // Extracting decades...
  doc.decades().then(function(decades) {
    var stats = { decades: decades };
    // Extracting slope...
    doc.centeredLosRegression().then(function(slope) {
      stats.slope = slope;
      // Raw number of doc extracted by second
      stats.pace = 0.7;
      // Timestamp of the last snapshot
      stats.lastSnapshot =  ~~(Date.now()/1e3)
      // Calculates the total number of docs
      stats.total = _.reduce( _.pluck(decades, 'count'), function(sum, c) {
        return sum + c;
      }, 0);
      console.log("Saving stats...");
      fs.writeFile(params.output, JSON.stringify(stats, null, 2), process.exit);
    });
  });
});
