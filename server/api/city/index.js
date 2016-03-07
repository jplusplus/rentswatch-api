'use strict';

var express = require('express');
var controller = require('./city.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/geocode', controller.geocode);
router.get('/:name', controller.show);

module.exports = router;
