'use strict';

// External helpers
var _ = require('lodash');
// Internal helpers
var response = require("../response"),
   paginator = require("../paginator");
// Collections and models
var cities = require('./city.collection');
var docs   = require('../doc/doc.model');

var INDEX_EXCLUDE = ['months', 'neighborhoods'];

/**
 * @api {get} /api/cities List of cities
 * @apiGroup Cities
 * @apiName Index
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
 * @apiSuccess {Number}   stdErr            Standard deviation of the rent prices.
 * @apiSuccess {Number}   inequalityIndex   A build-in inequality index.
 *
 * @apiError 401 Only authenticated users can access the data.
 * @apiErrorExample Response (example):
*     HTTP/1.1 401 Not Authenticated
*     {
*       "error": "Not authenticated request."
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
 * @apiGroup Cities
 * @apiName Show
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
 * @apiSuccess {Number}   stdErr            Standard deviation of the rent prices.
 * @apiSuccess {Number}   inequalityIndex   A build-in inequality index.
 * @apiSuccess {Object[]} months            Embeded statistics about the city by month.
 *
 * @apiError 401 Only authenticated users can access the data.
 * @apiErrorExample Response (example):
*     HTTP/1.1 401 Not Authenticated
*     {
*       "error": "Not authenticated request."
*     }
 */
exports.show = function(req, res) {
  var city = cities.get({ name: req.params.name });
  if(city) {
    res.status(200).json(city);
    /*city.getStats().then(function(stats) {
      city = _.extend( _.cloneDeep(city), stats);
      res.status(200).json(city);
    }).fail( response.handleError(res, 500) ); */
  } else {
    response.handleError(res, 404)('Not found');
  }
};

// Get stats arround a given place
exports.geocode = function(req, res) {
  var place = { q: req.query.q, radius: req.query.radius };
  if(place) {
    docs.center(52.52437, 13.41053, 20).then(function(rows) {
      res.status(200).json(docs.getStats(rows));
    }, response.handleError(res, 500)).fail(response.handleError(res, 500));
  } else {
    response.handleError(res, 404)('Not found');
  }
};
