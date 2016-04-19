'use strict';

var sqldb = require('../../sqldb'),
        _ = require('lodash'),
     math = require('mathjs'),
        Q = require('q'),
haversine = require('haversine');

const DEFAULT_CENTER_DISTANCE = 5;
const MAX_TOTAL_RENT = module.exports.MAX_TOTAL_RENT = 3000;
const MAX_LIVING_SPACE = module.exports.MAX_LIVING_SPACE = 200;

var getValues = module.exports.getValues = function(rows) {
  return _.reduce(rows, function(res, row) {
    res.x.push(row.total_rent);
    res.y.push(row.living_space);
    return res;
  }, { x:[], y:[] });
}

var getSlope = module.exports.getSlope = function(rows) {
  // Pluck two values at a time
  var values = getValues(rows);
  var sum_xy = 0, sum_xx = 0;

  for (var i = 0; i < values.y.length; i++) {
    sum_xy += (values.x[i]*values.y[i]);
    sum_xx += (values.x[i]*values.x[i]);
  }

  return sum_xy / sum_xx;
};

var getInequalityIndex = module.exports.getInequalityIndex = function(rows) {
  // Convert degree in radian
  var rad = (r)=> r * (Math.PI/180);
  // To save rows bounds
  var nlat = null, slat = null,
      wlon = null, elon = null;
  // To save every average prices
  var avgPricesPerSqm = [];
  // Iterator over rows to collect bound
  rows.forEach(function(row) {
    if(!row.latitude || !row.longitude) return;
    // Maximum latitude
    nlat = nlat === null ? row.latitude : Math.max(nlat, row.latitude);
    // Minimum latitude
    slat = slat === null ? row.latitude : Math.min(slat, row.latitude);
    // Maximum longitude
    elon = elon === null ? row.longitude : Math.max(elon, row.longitude);
    // Minimum longitude
    wlon = wlon === null ? row.longitude : Math.min(wlon, row.longitude);
  });
  // Creates 1km2 range
  for(var dslat = slat; dslat <= nlat;) {
    var dnlat = 1/110.574;
    for(var dwlon = wlon; dwlon <= elon;) {
      var delon = 1/(111.320 * Math.cos(rad(dslat)));
      // Collect rows for this slot
      var slotRows = _.filter(rows, function(row) {
        return row.latitude && row.longitude &&
               row.latitude > dslat  && row.latitude  < dslat + dnlat &&
               row.longitude > dwlon && row.longitude < dwlon + delon;
      });
      // At leat 5 docs
      if( slotRows.length >= 5) {
        avgPricesPerSqm.push( 1/getSlope(slotRows) );
      }
      dwlon += delon;
    }
    dslat += dnlat;
  }
  // At last, we calculate the variance of every average prices
  return avgPricesPerSqm.length ? math.std(avgPricesPerSqm) : null;
};

var getStats = module.exports.getStats = function(rows, radius, byMonth) {
  // Help to extract a uniq key by month for the given row
  var getMonthKey = function(row) {
    var date  = new Date(row.created_at);
    var month = "0" + (date.getMonth() + 1)
    return date.getFullYear() + '-' + month.substr(month.length - 2)
  };
  var values = getValues(rows);
  var slope = getSlope(rows);
  // Calculate standard error by sqm
  var residualsSum = 0;
  for(var i = 0; i < values.y.length; i++) {
    var distanceToLine = Math.abs(values.x[i]*slope - values.y[i]) / Math.sqrt(Math.pow(slope, 2) + 1)
    residualsSum += distanceToLine
  }
  var std = 1/Math.sqrt(residualsSum/(values.y.length-1));
  var stdErr = 1/std / Math.sqrt(values.y.length);
  // Colect full statistics about this row
  var stats = {
    // Extract number of documents
    total: rows.length,
    // Extract the slope for the given rows
    avgPricePerSqm: rows.length > 3 ? 1/slope : null,
    // Timestamp of the last snapshot
    lastSnapshot:  ~~(Date.now()/1e3),
    // Caculate std for this area
    stdErr: stdErr
  };
  // Create an array containg stats aggregated by month
  if(byMonth) {
    // Calculate inequalityIndex for city with a radius smaller than 100km
    if(radius && radius < 100) {
      // Subsets with month must include an inequality index
      stats.inequalityIndex = getInequalityIndex(rows) * slope;
    }
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
          getStats(rows, radius, false)
        );
      })
      // Sort by month key
      .sortBy('month').value();
  }
  // Return stats object
  return stats;
};


// Filter rows in the given radius according to a center
var inRadius = module.exports.inRadius = function(rows, latitude, longitude, radius) {
  // Convert degree in radian
  var rad = (r)=> r * (Math.PI/180);
  // Compute square bounds
  var nlat = latitude  + radius / 110.574;
  var slat = latitude  - radius / 110.574;
  var wlon = longitude - radius / (111.320 * Math.cos(rad(latitude)));
  var elon = longitude + radius / (111.320 * Math.cos(rad(latitude)));

  return _.chain(rows).filter(function(row) {
    // Only rows in the square
    return nlat > row.latitude && slat < row.latitude && wlon < row.longitude && elon > row.longitude;
  }).filter(function(row) {
    // Use haversine to calculate the distance between the points
    return haversine(row, { latitude: latitude, longitude: longitude }) < radius * 1e3;
  }).value();
};

// Gets all ads
var all = module.exports.all = function() {
  var deferred = Q.defer();
  // Build a query to get every trustable ads
  var query = [
    'SELECT total_rent, living_space, latitude, longitude, created_at',
    'FROM ad',
    'WHERE total_rent IS NOT NULL',
    'AND total_rent < ' + MAX_TOTAL_RENT,
    'AND living_space < ' + MAX_LIVING_SPACE
  ].join("\n");
  // For better performance we use a poolConnection
  sqldb.mysql.getConnection(function(err, connection) {
    if(err) deferred.reject(err);
    // We use the given connection
    else connection.query(query, function(err, rows) {
      if(err) deferred.reject(err);
      else deferred.resolve(rows);
      // And done with the connection.
      connection.release();
    });
  });
  // Return the promise
  return deferred.promise;
};

// Gets all ads in a given radius
var center = module.exports.center = function(lat, lon, radius, limit) {
  // Return the promise
  var deferred = Q.defer();
  // We may use a default radius
  radius = radius || DEFAULT_CENTER_DISTANCE;
  // Convert degree in radian
  var rad = (r)=> r * (Math.PI/180);
  // Round value
  var rn =(v)=> Math.round(v*1e9)/1e9
  // Compute square bounds
  var nlat = lat + radius / 110.574;
  var slat = lat - radius / 110.574;
  var wlon = lon - radius / (111.320 * Math.cos(rad(lat)));
  var elon = lon + radius / (111.320 * Math.cos(rad(lat)));
  // Build a query to get every trustable ads
  var query = [
    'SELECT total_rent, living_space, latitude, longitude, created_at',
    'FROM ad',
    'WHERE total_rent IS NOT NULL',
    'AND total_rent < ' + MAX_TOTAL_RENT,
    'AND living_space < ' + MAX_LIVING_SPACE,
    // For performance reason we filter the rows using
    // a simple square comparaison
    'AND ' + rn(nlat) + ' > latitude AND  ' + rn(slat) + ' < latitude',
    'AND ' + rn(wlon) + ' < longitude AND ' + rn(elon) + ' > longitude'
  ];
  // Should we limit the query
  if(limit && limit > 0) {
    query.push('ORDER BY created_at DESC');
    query.push('LIMIT ' + parseInt(limit) );
  }
  // For better performance we use a poolConnection
  sqldb.mysql.getConnection(function(err, connection) {
    // We use the given connection
    connection.query(query.join("\n"), function(err, rows) {
      if(err) deferred.reject(err);
      else {
        // We refilter every rows to have more precise selection
        deferred.resolve(_.filter(rows, function(row) {
          // Use haversine to calculate the distance between the points
          return haversine(row, {latitude: lat, longitude: lon}) < radius * 1e3;
        }));
      }
      // And done with the connection.
      connection.release();
    });
  });
  // Return the promise
  return deferred.promise;
};

// Count rents by deciles
var deciles = module.exports.deciles = function(rows) {
  var deferred = Q.defer();
  var deciles = [];
  // Create a range for every decile
  for(var i = 30; i < MAX_TOTAL_RENT;) {
    deciles.push({
      from: i,
      to: i + 10,
      count: _.filter(rows, function(row) {
        return row.total_rent && row.total_rent >= i && row.total_rent < i + 10;
      }).length
    });
    // Move from 10 to 10
    i += 10;
  }
  // We resolve a promise for retro-compatibility
  deferred.resolve(deciles);
  // Return the promise
  return deferred.promise;
};


var losRegression = module.exports.losRegression = function() {
  // Return the promise
  return all().then(getSlope)
};

var centeredLosRegression = module.exports.losRegression = function(lat, lon, distance) {
  // Return the promise
  return center(lat, lon, distance).then(getSlope)
};
