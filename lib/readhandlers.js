const assert = require('assert');
const thing = require('core-util-is');
const path = require('path');
const fs = require('fs');

/**
 * Determines if the given method is a supported HTTP method.
 * @param method
 * @returns {boolean}
 */
function isHttpMethod(method) {
  return (typeof method === 'string') && {
    get: 'GET',
    post: 'POST',
    put: 'PUT',
    delete: 'DELETE',
    head: 'HEAD',
    options: 'OPTIONS',
    trace: 'TRACE',
    connect: 'CONNECT',
    patch: 'PATCH',
  // eslint-disable-next-line no-prototype-builtins
  }.hasOwnProperty(method.toLowerCase());
}

/**
 * Reads the given path and requires all .js files.
 * @param path
 * @returns {{}}
 */
function read(dir) {
  let handlers; let
    obj;

  if (thing.isString(dir)) {
    assert.ok(fs.existsSync(dir), 'Specified or default \'handlers\' directory does not exist.');

    handlers = {};

    fs.readdirSync(dir).forEach((name) => {
      const abspath = path.join(dir, name);
      const stat = fs.statSync(abspath);
      const key = name.replace(/\.js/, '');

      if (stat.isFile()) {
        if (name.match(/^.*\.(js)$/)) {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          obj = require(abspath);

          if (!handlers[key]) {
            handlers[key] = {};
          }

          Object.keys(obj).forEach((k) => {
            handlers[key][isHttpMethod(k) ? `$${k.toLowerCase()}` : k] = obj[k];
          });
        }
      }
      if (stat.isDirectory()) {
        handlers[key] = read(abspath);
      }
    });

    return handlers;
  }

  return dir;
}

module.exports = read;
