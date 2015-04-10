'use strict';

var assert = require('assert'),
    thing = require('core-util-is'),
    path = require('path'),
    fs = require('fs');

/**
 * Reads the given path and requires all .js files.
 * @param path
 * @returns {{}}
 */
function read(dir) {
    var handlers, obj;

    if (thing.isString(dir)) {
        assert.ok(fs.existsSync(dir), 'Specified or default \'handlers\' directory does not exist.');

        handlers = {};

        fs.readdirSync(dir).forEach(function (name) {
            var abspath, key, stat;

            abspath = path.join(dir, name);
            stat = fs.statSync(abspath);
            key = name.replace(/\.js/, '');

            if (stat.isFile()) {
                if (name.match(/^.*\.(js)$/)) {
                    obj = require(abspath);

                    if (!handlers[key]) {
                        handlers[key] = {};
                    }

                    Object.keys(obj).forEach(function (k) {
                        handlers[key][isHttpMethod(k) ? '$' + k.toLowerCase() : k] = obj[k];
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
        patch: 'PATCH'
    }.hasOwnProperty(method.toLowerCase());
}

module.exports = read;
