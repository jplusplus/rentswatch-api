'use strict';

var express = require('express');
var controller = require('./city.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:name', controller.show);
router.get('/geocode', controller.geocode);

module.exports = router;
