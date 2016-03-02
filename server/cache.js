var memjs = require('memjs'),
   memory = require('memory-cache');

function Cache(config) {
  if(config && config.servers) {
    console.log("Cache servers: %s", config.servers);
    this.client = memjs.Client.create(config.servers, {
      username: config.username,
      password: config.password
    });
  }
  // Save memcached config
  this.config = config;
  // Noop function for empty callback
  this.noop = function() { };
};

Cache.prototype.get = function(key, callback) {
  // No callback
  callback = callback || this.noop
  // Use cache client
  if(this.client) this.client.get(key, callback);
  // Use memory cache
  else callback(null, memory.get(key));
};

Cache.prototype.set = function(key, val, callback, expiration) {
  // No callback
  callback = callback || this.noop
  // Use a default expiration
  expiration = expiration || 600;
  // Use cache client
  if(this.client) this.client.set(key, val, callback, expiration);
  // Use memory cache
  else callback(null, memory.put(key, val, expiration) );
}

Cache.prototype.del = function(key, callback) {
  // No callback
  callback = callback || this.noop
  // Use cache client
  if(this.client) this.client.delete(key, callback);
  // Use memory cache
  else callback(null, memory.del(key));
}

Cache.prototype.flush = function(callback) {
  // No callback
  callback = callback || this.noop
  // Use cache client
  if(this.client) this.client.flush(callback);
  // Use memory cache
  else callback(null, memory.clear(key));
}


var config  = require('./config/environment');
// Instansicate the cache class
module.exports = new Cache(config.memcached);
