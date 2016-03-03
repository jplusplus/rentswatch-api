var sqldb = require('../../sqldb'),
        _ = require('lodash'),
     math = require('mathjs'),
        Q = require('q'),
haversine = require('haversine');

const DEFAULT_CENTER_DISTANCE = 5;
const MAX_TOTAL_RENT = module.exports.MAX_TOTAL_RENT = 3000;
const MAX_LIVING_SPACE = module.exports.MAX_LIVING_SPACE = 200;


var getSlope = module.exports.getSlope = function(rows) {
  // Pluck two values at a time
  var values = _.reduce(rows, function(res, row) {
    res.x.push(row.total_rent);
    res.y.push(row.living_space);
    return res;
  }, { x:[], y:[] });

  var sum_xy = sum_xx = 0;

  for (var i = 0; i < values.y.length; i++) {
    sum_xy += (values.x[i]*values.y[i]);
    sum_xx += (values.x[i]*values.x[i]);
  }

  return sum_xy / sum_xx;
};

var getStats = module.exports.getStats = function(rows, byMonth) {
  // Help to extract a uniq key by month for the given row
  var getMonthKey = function(row) {
    var date  = new Date(row.created_at);
    var month = "0" + (date.getMonth() + 1)
    return date.getFullYear() + '-' + month.substr(month.length - 2)
  };
  // Colect full statistics about this row
  var stats = {
    // Extract number of documents
    total: rows.length,
    // Extract the slope for the given rows
    avgPricePerSqm: 1/getSlope(rows),
    // Timestamp of the last snapshot
    lastSnapshot:  ~~(Date.now()/1e3),
    // Caculate std for this area
    stdErr: rows.length ? math.std( _.map(rows, 'total_rent') ) : null,
  };
  // Create an array containg stats aggregated by month
  if(byMonth) {
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
          getStats(rows, false)
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
  // Convert KM radius in degree
  var rad = (r)=> r * (Math.PI/180);

  // Compute square bounds
  nlat = latitude  + city_radius / 110.574
  slat = latitude  - city_radius / 110.574
  wlon = longitude - city_radius / (111.320 * Math.cos(rad(latitude)))
  elon = longitude + city_radius / (111.320 * Math.cos(rad(latitude)))

  return _.chain(rows).filter(function(row) {
    // Only rows in the square
    return nlat > row.latitude && slat < row.latitude && wlon > row.longitude && elon < row.longitude;
  }).filter(function(row) {
    return haversine(row, { latitude: latitude, longitude: longitude }) < radius * 1e3
  })
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
    'AND living_space < ' + MAX_LIVING_SPACE,
    //'AND price_per_sqm < 70',
    // 'AND price_per_sqm > 3',
  ].join("\n");
  // For better performance we use a poolConnection
  sqldb.mysql.getConnection(function(err, connection) {
    // We use the given connection
    connection.query(query, function(err, rows) {
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
var center = module.exports.center = function(lat, lng, distance) {
  // Convert KM radius in degree
  var deg = (distance || DEFAULT_CENTER_DISTANCE) * 1/110.574;
  // Return the promise
  var deferred = Q.defer();
  // Build a query to get every trustable ads
  var query = [
    'SELECT total_rent, living_space, latitude, longitude, created_at',
    'FROM ad',
    'WHERE total_rent IS NOT NULL',
    'AND total_rent < ' + MAX_TOTAL_RENT,
    'AND living_space < ' + MAX_LIVING_SPACE,
    'AND POWER(' + lng + ' - longitude, 2) + POWER(' + lat + ' - latitude, 2) <= POWER(' + deg + ', 2)',
    //'AND price_per_sqm < 70',
    // 'AND price_per_sqm > 3',
  ].join("\n");
  // For better performance we use a poolConnection
  sqldb.mysql.getConnection(function(err, connection) {
    // We use the given connection
    connection.query(query, function(err, rows) {
      if(err) deferred.reject(err);
      else deferred.resolve(rows);
      // And done with the connection.
      connection.release();
    });
  });
  // Return the promise
  return deferred.promise;
};

// Count rents by deciles
var deciles = module.exports.deciles = function() {
  var deferred = Q.defer();
  // Build a query to get every trustable ads
  var query = [
    'SELECT',
      '10 * (total_rent div 10) as "from",',
      '10 * (total_rent div 10) + 10 as "to",',
      'COUNT(id) as "count"',
    'FROM ad',
    'WHERE total_rent IS NOT NULL',
    'AND total_rent < ' + MAX_TOTAL_RENT,
    'AND living_space < ' + MAX_LIVING_SPACE,
    'GROUP BY total_rent div 10'
  ].join("\n");
  // For better performance we use a poolConnection
  sqldb.mysql.getConnection(function(err, connection) {
    // We use the given connection
    connection.query(query, function(err, rows, fields) {
      if(err) deferred.reject(err);
      else deferred.resolve(rows, fields);
      // And done with the connection.
      connection.release();
    });
  });
  // Return the promise
  return deferred.promise;
};


var centeredCount = module.exports.centeredCount = function(lat, lng, distance) {
  var deferred = Q.defer();
  // Convert KM radius in degree
  var deg = (distance || DEFAULT_CENTER_DISTANCE) * 1/110.574;
  // Build a query to get every trustable ads
  var query = [
    'SELECT COUNT(id) as "count"',
    'FROM ad',
    'WHERE total_rent IS NOT NULL',
    'AND total_rent < ' + MAX_TOTAL_RENT,
    'AND living_space < ' + MAX_LIVING_SPACE,
    'AND POWER(' + lng + ' - longitude, 2) + POWER(' + lat + ' - latitude, 2) <= POWER(' + deg + ', 2)'
  ].join("\n");
  // For better performance we use a poolConnection
  sqldb.mysql.getConnection(function(err, connection) {
    // We use the given connection
    connection.query(query, function(err, rows, fields) {
      if(err || !rows.length) deferred.reject(err);
      else deferred.resolve(rows[0].count);
      // And done with the connection.
      connection.release();
    });
  });
  // Return the promise
  return deferred.promise;
};

// Count rents by deciles around a point
var centeredDeciles = module.exports.centeredDeciles = function(lat, lng, distance) {
  var deferred = Q.defer();
  // Convert KM radius in degree
  var deg = (distance || DEFAULT_CENTER_DISTANCE) * 1/110.574;
  // Build a query to get every trustable ads
  var query = [
    'SELECT',
      '10 * (total_rent div 10) as "from",',
      '10 * (total_rent div 10) + 10 as "to",',
      'COUNT(id) as "count"',
    'FROM ad',
    'WHERE total_rent IS NOT NULL',
    'AND total_rent < ' + MAX_TOTAL_RENT,
    'AND living_space < ' + MAX_LIVING_SPACE,
    'AND POWER(' + lng + ' - longitude, 2) + POWER(' + lat + ' - latitude, 2) <= POWER(' + deg + ', 2)',
    'GROUP BY total_rent div 10'
  ].join("\n");
  // For better performance we use a poolConnection
  sqldb.mysql.getConnection(function(err, connection) {
    // We use the given connection
    connection.query(query, function(err, rows, fields) {
      if(err) deferred.reject(err);
      else deferred.resolve(rows, fields);
      // And done with the connection.
      connection.release();
    });
  });
  // Return the promise
  return deferred.promise;
};

var losRegression = module.exports.losRegression = function() {
  // Return the promise
  return all().then(getSlope)
};

var centeredLosRegression = module.exports.losRegression = function(lat, lng, distance) {
  // Return the promise
  return center(lat, lng, distance).then(getSlope)
};
