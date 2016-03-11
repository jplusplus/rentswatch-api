var _ = require('lodash');
var response = require("./response");
// Get auth tokens
const TOKENS = _.compact( (process.env.AUTH_TOKENS || '').split(',') );

module.exports.token = function(req, res, next) {
  // Handle missing token
  if( !req.query.token ) {
    return response.handleError(res, 403)({
      error: 'Missing authentication token.'
    });
  // Unauthorized token
  } else if( TOKENS.indexOf(req.query.token) === -1 ) {
    return response.handleError(res, 401)({
      error: 'Unauthorized token.'
    });
  }

  // Continue normally
  next();
};
