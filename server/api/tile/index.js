'use strict';

var express    = require('express');
var controller = require('./tile.controller');

var router = express.Router();

router.get('/:z(\\d+)/:x(\\d+)/:y(\\d+)', controller.proxy);
router.get('/:z(\\d+)/:x(\\d+)/:y(\\d+).json', controller.proxy);
router.get('/:z(\\d+)/:x(\\d+)/:y(\\d+).geojson', controller.proxy);

module.exports = router;
