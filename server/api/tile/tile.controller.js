'use strict';

var request = require('request');
var response = require("../response");

/**
 * @api {get} /api/tiles/:z/:x/:y GeoJSON tile for a given ZXY
 * @apiParam {Number} z Zoom level of the tile
 * @apiParam {Number} x X number of the tile for the given zoom level
 * @apiParam {Number} y Y number of the tile for the given zoom level
 * @apiPermission Public
 * @apiGroup tiles
 * @apiName proxy
 *
 * @apiDescription GeoJSON tiles of the rent prices.
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://api.rentswatch.com/api/tiles/10/489/379
 *
 * @apiSuccess {String} type  Type of the geojson.
 * @apiSuccess {Array} features.geometry  The GeoJSON geometry.
 * @apiSuccess {String} features.properties.price_per_sqm  Average price per square meter in Euro. The average price is the slope of the regression of each property's living space and total rent (including utilities).
 * @apiError 404 Tile not found
 * @apiErrorExample Response (example):
 *     HTTP/1.1 404 Not found
 *     {
 *       "error": "Unable to find this file."
 *     }
 */
exports.proxy = function(req, res) {
  var url = req.app.get('tiles_host') + "tiles/";
  url += [req.params.z, req.params.x, req.params.y].join('/');
  url += ".geojson";
  request({ url: url, json: true }, function(err, r, geojson) {
    if(err || r.statusCode !== 200) {
      return response.handleError(res, 404)("Unable to find this file.");
    } else {
      res.jsonp(geojson);
    }
  })
};
