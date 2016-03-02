var sqldb = require('../../sqldb'),
        _ = require('lodash'),
        Q = require('q');

const DEFAULT_CENTER_DISTANCE = 5;
const MAX_TOTAL_RENT = module.exports.MAX_TOTAL_RENT = 3000;
const MAX_LIVING_SPACE = module.exports.MAX_LIVING_SPACE = 200;


var extractSlope = module.exports.extractSlope = function(rows) {
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
  var deg = (distance || DEFAULT_CENTER_DISTANCE) * .01;
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

// Count rents by decades
var decades = module.exports.decades = function() {
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
  var deg = (distance || DEFAULT_CENTER_DISTANCE) * .01;
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

// Count rents by decades around a point
var centeredDecades = module.exports.centeredDecades = function(lat, lng, distance) {
  var deferred = Q.defer();
  // Convert KM radius in degree
  var deg = (distance || DEFAULT_CENTER_DISTANCE) * .01;
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
  return all().then(extractSlope)
};

var centeredLosRegression = module.exports.losRegression = function(lat, lng, distance) {
  // Return the promise
  return center(lat, lng, distance).then(extractSlope)
};
