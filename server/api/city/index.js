'use strict';

var express    = require('express');
var controller = require('./city.controller');
var authentication = require('../authentication');

var router = express.Router();

router.get('/', authentication.token, controller.index);
router.get('/geocode', authentication.token, controller.geocode);
router.get('/:name', authentication.token, controller.show);

module.exports = router;
