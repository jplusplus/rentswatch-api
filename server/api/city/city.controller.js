'use strict';

// External helpers
var   _ = require('lodash'),
request = require('request');
// Internal helpers
var response = require("../response"),
   paginator = require("../paginator");
// Collections and models
var cities = require('./city.collection');
var docs   = require('../doc/doc.model');

var INDEX_EXCLUDE = ['months', 'neighborhoods'];

/**
 * @api {get} /api/cities List of cities
 * @apiPermission Public
 * @apiGroup cities
 * @apiName index
 *
 * @apiDescription
 *  An array of cities based on a hardcoded list.
 *  For each city, the average price, the standard error and the inequality index.
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://api.rentswatch.com/api/cities
 *
 * @apiSuccess {String}   name              Name of the city.
 * @apiSuccess {Number}   latitude          Latitude of the epicenter of the city.
 * @apiSuccess {Number}   longitude         Longitude of the epicenter of the city.
 * @apiSuccess {String}   country           ISO3 code of the country.
 * @apiSuccess {Number}   radius            Distance from the epicenter in KM covered by this city.
 * @apiSuccess {String}   slug              A slug version of the name of the city.
 * @apiSuccess {Number}   total             Total number of documents used to generates statistics.
 * @apiSuccess {Number}   avgPricePerSqm    Average price per m² in Euro.
 * @apiSuccess {Number}   lastSnapshot      Timestamp of the last snapshot of this data.
 * @apiSuccess {Number}   stdErr            Standard deviation of the rent prices per m².
 * @apiSuccess {Number}   inequalityIndex   A build-in inequality index.
 *
 * @apiError 401 Only authenticated users can access the data.
 * @apiErrorExample Response (example):
 *     HTTP/1.1 401 Not Authenticated
 *     {
 *       "error": "Unauthorized token."
 *     }
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
  // Return a slice of the collections
  }));
};

/**
 * @api {get} /api/cities/:slug Statistics about a single city
 * @apiParam {String} slug Slug of the city
 * @apiPermission Public
 * @apiGroup cities
 * @apiName show
 *
 * @apiDescription
 *  A full object describing a city by its statistics.
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://api.rentswatch.com/api/cities/berlin
 *
 * @apiSuccess {String}   name              Name of the city.
 * @apiSuccess {Number}   latitude          Latitude of the epicenter of the city.
 * @apiSuccess {Number}   longitude         Longitude of the epicenter of the city.
 * @apiSuccess {String}   country           ISO3 code of the country.
 * @apiSuccess {Number}   radius            Distance from the epicenter in KM covered by this city.
 * @apiSuccess {Object[]} neighborhoods     Embeded statistics about the city's neighborhoods.
 * @apiSuccess {String}   slug              A slug version of the name of the city.
 * @apiSuccess {Number}   total             Total number of documents used to generates statistics.
 * @apiSuccess {Number}   avgPricePerSqm    Average price per m² in Euro.
 * @apiSuccess {Number}   lastSnapshot      Timestamp of the last snapshot of this data.
 * @apiSuccess {Number}   stdErr            Standard deviation of the rent prices per m².
 * @apiSuccess {Number}   inequalityIndex   A build-in inequality index.
 * @apiSuccess {Object[]} months            Embeded statistics about the city by month.
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
    if(req.query.sync) {
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
 * @api {get} /api/geocode Statistics about a given location
 * @apiParam {String} q Query to geocode the location.
 * @apiParam {Number} [radius=20] Radius in which we extract documents.
 * @apiParam {String} token User token (protected ressource).
 * @apiPermission Authenticated
 * @apiGroup cities
 * @apiName geocode
 *
 * @apiDescription
 *  The average rent and standard error for the location within the specified radius
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://api.rentswatch.com/api/cities/geocode?q=Marseille&token=<TOKEN>
 *
 * @apiSuccess {String}   name              Name of the location.
 * @apiSuccess {String}   type              Type of the location.
 * @apiSuccess {Number}   latitude          Latitude of the epicenter of the location.
 * @apiSuccess {Number}   longitude         Longitude of the epicenter of the location.
 * @apiSuccess {Number}   radius            Distance from the epicenter in KM covered by this location.
 * @apiSuccess {Number}   total             Total number of documents used to generates statistics.
 * @apiSuccess {Number}   avgPricePerSqm    Average price per m² in Euro.
 * @apiSuccess {Number}   lastSnapshot      Timestamp of the last snapshot of this data.
 * @apiSuccess {Number}   stdErr            Standard deviation of the rent prices per m².
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
  // Default and maxium radius is 20
  var place = { radius: Math.min(req.query.radius || 20, 20) };
  // Build geocoder URL
  var url = "http://nominatim.openstreetmap.org/search?";
  url += "format=json&";
  url += "limit=1&";
  url += "osm_type=N&";
  url += "&q=" + req.query.q;
  // Geocode the query
  request({ url: url, json: true }, function(err, resp, body) {
    // Field copied from OSM
    // No error?
    if(!err && body.length) {
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
