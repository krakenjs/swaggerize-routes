'use strict';

var assert = require('assert'),
    thing = require('core-util-is'),
    path = require('path'),
    fs = require('fs');

/**
 * Reads the given path and requires all files matching given extension (default js en coffee).
 * @param path
 * @param allowedExtensions
 * @returns {{}}
 */
function read(dir, allowedExtensions) {
    var handlers, obj;

    if (!thing.isString(dir)) {
        return dir;
    }

    assert.ok(fs.existsSync(dir), 'Specified or default \'handlers\' directory does not exist.');

    allowedExtensions = allowedExtensions || ['js', 'coffee'];
    if (thing.isString(allowedExtensions)) {
        allowedExtensions = [ allowedExtensions ];
    }
    assert.ok(thing.isArray(allowedExtensions), 'Specified extension(s) should be a string or array');

    handlers = {};

    fs.readdirSync(dir).forEach(function (name) {
        var abspath, key, stat, ext, allowedExtension;

        abspath = path.join(dir, name);
        stat = fs.statSync(abspath);

        ext = path.extname(name).split('.')[1] || '';
        allowedExtension = allowedExtensions.indexOf(ext) > -1;


        if (!allowedExtension) {
            ext = '';
        }
        key = path.basename(name, '.' + ext);

        if (stat.isFile() && allowedExtension) {
            obj = require(path.resolve(abspath));

            if (!handlers[key]) {
                handlers[key] = {};
            }

            Object.keys(obj).forEach(function (k) {
                handlers[key][isHttpMethod(k) ? '$' + k.toLowerCase() : k] = obj[k];
            });
        }
        if (stat.isDirectory()) {
            handlers[key] = read(abspath, allowedExtensions);
        }
    });

    return handlers;
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
