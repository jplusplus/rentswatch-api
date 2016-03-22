'use strict';

// External helpers
var   _ = require('lodash'),
request = require('request'),
   slug = require('slug'),
  fuzzy = require('fuzzy');
// Internal helpers
var response = require("../response"),
   paginator = require("../paginator");
// Collections and models
var cities = require('./city.collection');
var docs   = require('../doc/doc.model');

const INDEX_EXCLUDE = ['months', 'neighborhoods'];

/**
 * @api {get} /api/cities List of cities
 * @apiParam {Number} [offset=0] Offset to start from (each page returns 50 cities)
 * @apiPermission Public
 * @apiGroup Cities
 * @apiName index
 *
 * @apiDescription
 *  Returns a series of statistical information for each European city with a population above 100,000 inhabitants that Rentswatch monitors.
 *  For each city, the method returns the average price, the standard error and the inequality index.
 *  Cities are not defined by their administrative boundaries but by a circle around a geographical center.
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://api.rentswatch.com/api/cities
 *
 * @apiSuccess {String}   name              Name of the city.
 * @apiSuccess {Number}   latitude          Latitude of the geographical center of the city.
 * @apiSuccess {Number}   longitude         Longitude of the geographical center of the city.
 * @apiSuccess {String}   country           ISO-alpha 3 code of the country.
 * @apiSuccess {Number}   radius            Radius of the city in kilometers.
 * @apiSuccess {String}   slug              A slug version of the name of the city.
 * @apiSuccess {Number}   total             Total number of data points used to generate the statistics.
 * @apiSuccess {Number}   avgPricePerSqm    Average price per square meter in Euro. The average price is the slope of the regression of each property's living space and total rent (including utilities).
 * @apiSuccess {Number}   lastSnapshot      Timestamp of the generation of these statistics. Starting point is September 2015 unless otherwise noted.
 * @apiSuccess {Number}   stdErr            Standard deviation of the average rent price. The actual rent prices in a city are avgPricePerSqm + or - stdErr per square meters.
 * @apiSuccess {Number}   inequalityIndex   A build-in inequality index. It is the standard deviation of the rent prices between neighborhoods. An inequality index of 0 means that rents in all neighborhoods are the same. The larger the differences, the larger the index.
 *
 */
exports.index = function(req, res) {
  // Build paginator parameters
  var params = paginator.offset(req);
  var list = cities.toArray().slice(params.offset, params.offset + params.limit);
  // Maps the cities array to remove some properties
  res.status(200).json(_.map(list, function(city) {
    city = _.cloneDeep(city);
    // Delete some properties
    INDEX_EXCLUDE.forEach(function(k) { delete city[k] });
    return city;
  }));
};

/**
 * @api {get} /api/cities/:slug Statistics about a single city
 * @apiParam {String} slug Slug of the city
 * @apiPermission Public
 * @apiGroup Cities
 * @apiName show
 *
 * @apiDescription
 *  A series of statistics for a given city.
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://api.rentswatch.com/api/cities/berlin
 *
 * @apiSuccess {String}   name              Name of the city.
 * @apiSuccess {Number}   latitude          Latitude of the geographical center of the city.
 * @apiSuccess {Number}   longitude         Longitude of the geographical center of the city.
 * @apiSuccess {String}   country           ISO-alpha 3 code of the country.
 * @apiSuccess {Number}   radius            Radius of the city in kilometers.
 * @apiSuccess {Object[]} neighborhoods     A list of neighborhoods for the city. For each neighborhood, the same statistics are provided.
 * @apiSuccess {String}   slug              A slug version of the name of the city.
 * @apiSuccess {Number}   total             Total number of data points used to generate the statistics.
 * @apiSuccess {Number}   avgPricePerSqm    Average price per square meter in Euro. The average price is the slope of the regression of each property's living space and total rent (including utilities).
 * @apiSuccess {Number}   lastSnapshot      Timestamp of the generation of these statistics. Starting point is September 2015 unless otherwise noted.
 * @apiSuccess {Number}   stdErr            Standard deviation of the average rent price. The actual rent prices in a city are avgPricePerSqm + or - stdErr per square meters.
 * @apiSuccess {Number}   inequalityIndex   A build-in inequality index. It is the standard deviation of the rent prices between neighborhoods. An inequality index of 0 means that rents in all neighborhoods are the same. The larger the differences, the larger the index.
 * @apiSuccess {Object[]} months            Statistics about rent prices in the city by month.
 *
 * @apiError 404 City not found
 * @apiErrorExample Response (example):
 *     HTTP/1.1 404 Not Authenticated
 *     {
 *       "error": "Not found."
 *     }
 */
exports.show = function(req, res) {
  var city = cities.get({ name: req.params.name });
  if(city) {
    // Temporary sync method to get city's stats
    if(req.query.sync && req.app.get('env') === 'development') {
      city.getStats().then(function(stats) {
        city = _.extend( _.cloneDeep(city), stats);
        res.status(200).json(city);
      }).fail( response.handleError(res, 500) );
    } else {
      res.status(200).json(city);
    }
  } else {
    response.handleError(res, 404)('Not found');
  }
};

/**
 * @api {get} /api/search Search a city by its name
 * @apiParam {String} q City name to look for.
 * @apiParam {Number} [has_neighborhoods=0] If '1', cities without neighborhoods are excluded.
 * @apiParam {Number} [offset=0] Offset to start from (each page returns 50 cities)
 * @apiPermission Public
 * @apiGroup Cities
 * @apiName search
 *
 * @apiDescription
 *  Find one or several cities for that Rentswatch monitors with there statistical information.
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://api.rentswatch.com/api/search?q=Berlin
 *
 * @apiSuccess {String}   name              Name of the city.
 * @apiSuccess {Number}   latitude          Latitude of the geographical center of the city.
 * @apiSuccess {Number}   longitude         Longitude of the geographical center of the city.
 * @apiSuccess {String}   country           ISO-alpha 3 code of the country.
 * @apiSuccess {Number}   radius            Radius of the city in kilometers.
 * @apiSuccess {String}   slug              A slug version of the name of the city.
 * @apiSuccess {Number}   total             Total number of data points used to generate the statistics.
 * @apiSuccess {Number}   avgPricePerSqm    Average price per square meter in Euro. The average price is the slope of the regression of each property's living space and total rent (including utilities).
 * @apiSuccess {Number}   lastSnapshot      Timestamp of the generation of these statistics. Starting point is September 2015 unless otherwise noted.
 * @apiSuccess {Number}   stdErr            Standard deviation of the average rent price. The actual rent prices in a city are avgPricePerSqm + or - stdErr per square meters.
 * @apiSuccess {Number}   inequalityIndex   A build-in inequality index. It is the standard deviation of the rent prices between neighborhoods. An inequality index of 0 means that rents in all neighborhoods are the same. The larger the differences, the larger the index.
 *
 */
exports.search = function(req, res) {
  // Build paginator parameters
  var params = paginator.offset(req);
  var q = slug(req.query.q || "");
  // Must specified a query parameter
  if(!q || q.length < 1) {
    return response.validationError(res)({ error: "'q' parameter must not be empty."});
  }
  // Look for a city by its name
  var filtered = cities.filter(function(item) {
    if(1*req.query.has_neighborhoods && !item.neighborhoods) return false;
    // Slugify city's name with slug
    return fuzzy.test(q, slug(item.name || ''));
  });
  // Pick a slice
  filtered = filtered.toArray().slice(params.offset, params.offset + params.limit);
  // Maps the cities array to remove some properties
  res.status(200).json(_.map(filtered, function(city) {
    city = _.cloneDeep(city);
    // Delete some properties
    INDEX_EXCLUDE.forEach(function(k) { delete city[k] });
    return city;
  }));
};

/**
 * @api {get} /api/geocode Statistics about a given location
 * @apiParam {String} q Query to geocode the location.
 * @apiParam {Number} [radius=20] Radius of the circle to generate statistics from.
 * @apiParam {String} token User token (protected ressource).
 * @apiPermission Authenticated
 * @apiGroup Cities
 * @apiName geocode
 *
 * @apiDescription
 *  A series of statistical indicators for a given location and a given radius. The query is geolocated using Open Street Map. It accepts city names, neighborhoods, addresses or any other descriptor.
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://api.rentswatch.com/api/cities/geocode?q=Marseille&token=<TOKEN>
 *
 * @apiSuccess {String}   name              Name of the location.
 * @apiSuccess {String}   type              OSM type of the location.
 * @apiSuccess {Number}   latitude          Latitude of the geographical center of the location.
 * @apiSuccess {Number}   longitude         Longitude of the geographical center of the location.
 * @apiSuccess {Number}   radius            Radius of the city in kilometers.
 * @apiSuccess {Number}   total             Total number of data points used to generate the statistics.
 * @apiSuccess {Number}   avgPricePerSqm    Average price per square meter in Euro. The average price is the slope of the regression of each property's living space and total rent (including utilities).
 * @apiSuccess {Number}   lastSnapshot      Timestamp of the generation of these statistics. Starting point is September 2015 unless otherwise noted.
 * @apiSuccess {Number}   stdErr            Standard deviation of the average rent price. The actual rent prices in a city are avgPricePerSqm + or - stdErr per square meters.
 *
 * @apiError 401 Only authenticated users can access the data.
 * @apiErrorExample Response (example):
 *     HTTP/1.1 401 Not Authenticated
 *     {
 *       "error": "Unauthorized token."
 *     }
 */
exports.geocode = function(req, res) {
  if(!req.query.q) return response.handleError(res, 400)("Missing 'q' parameter.")
  // Get current radius
  var radius = req.query.radius || 20;
  radius = isNaN(radius) ? 20 : radius;
  radius = Math.min(radius, 20);
  // Default and maxium radius is 20
  var place = { radius: radius };
  // Build geocoder URL
  var url = "http://nominatim.openstreetmap.org/search";
  // Build geocoder params
  var params = {
    format: "json",
    limit: 1,
    osm_type: "N",
    q: req.query.q,
  };
  // Geocode the query
  request({ url: url, json: true, qs: params }, function(err, resp, body) {
    // Field copied from OSM
    // No error?
    if(!err && body.length && body.push) {
      // Extend place with the result
      place = _.extend(place, {
        latitude:  body[0].lat * 1,
        longitude: body[0].lon * 1,
        name:      body[0].display_name,
        type:      body[0].type
      });
      // Get rows for this place
      docs.center(place.latitude, place.longitude, place.radius).then(function(rows) {
        // Return the place and the stats associated to it
        res.status(200).json(_.extend(place, docs.getStats(rows) ));
      }, response.handleError(res, 500)).fail(response.handleError(res, 500));
    } else {
      response.handleError(res, 404)('Not found');
    }
  });
};
