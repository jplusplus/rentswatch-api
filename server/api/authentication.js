var response = require("./response");

module.exports.token = function(req, res, next) {
  // Handle missing token
  if( !req.query.token ) {
    return response.handleError(res, 403)({
      error: 'Missing authentication token.'
    });
  // Unauthorized token
  } else if( req.app.get('auth_tokens').indexOf(req.query.token) === -1 ) {
    return response.handleError(res, 401)({
      error: 'Unauthorized token.'
    });
  }

  // Continue normally
  next();
};
