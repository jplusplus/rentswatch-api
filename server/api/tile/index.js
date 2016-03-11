'use strict';

var express    = require('express');
var controller = require('./tile.controller');

var router = express.Router();

router.get('/:x(\\d+)/:y(\\d+)/:z(\\d+)', controller.proxy);
router.get('/:x(\\d+)/:y(\\d+)/:z(\\d+).json', controller.proxy);
router.get('/:x(\\d+)/:y(\\d+)/:z(\\d+).geojson', controller.proxy);

module.exports = router;
