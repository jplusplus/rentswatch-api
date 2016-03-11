'use strict';

var request = require('request');
var response = require("../response");

/**
 * @api {get} /api/tiles/:x/:y/:z Tile as geojson for a given location
 * @apiParam {Number} x Longitude of the tile
 * @apiParam {Number} y Latitude of the tile
 * @apiParam {Number} z Zoom level of the tile
 * @apiPermission Public
 * @apiGroup tiles
 * @apiName proxy
 *
 * @apiDescription Tiles as geojson
 *
 * @apiExample {curl} Example usage:
 *     curl -i http://api.rentswatch.com/api/tiles/10/489/379
 *
 * @apiSuccess {String} type  Type of the geojson.
 * @apiError 404 Tile not found
 * @apiErrorExample Response (example):
 *     HTTP/1.1 404 Not found
 *     {
 *       "error": "Unable to find this file."
 *     }
 */
exports.proxy = function(req, res) {
  var url = req.app.get('tiles_host') + "tiles/";
  url += [req.params.x, req.params.y, req.params.z].join('/');
  url += ".geojson";
  request({ url: url, json: true }, function(err, r, geojson) {
    if(err || r.statusCode !== 200) {
      return response.handleError(res, 404)("Unable to find this file.");
    } else {
      res.jsonp(geojson);
    }
  })
};
