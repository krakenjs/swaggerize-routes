'use strict';

var assert = require('assert'),
    schema = require('./schema'),
    thing = require('core-util-is'),
    path = require('path'),
    caller = require('caller'),
    utils = require('./utils'),
    buildroutes = require('./buildroutes');

function swaggerize(options) {
    var validation, basePath, routes;

    assert.ok(thing.isObject(options), 'Expected options to be an object.');
    assert.ok(thing.isObject(options.api), 'Expected an api definition.');

    options.api.resourcePath = utils.prefix(options.api.resourcePath || '/', '/');

    validation = schema.validate(options.api);

    assert.ifError(validation.error);

    if (thing.isString(options.handlers) || !options.handlers) {
        options.handlers = options.handlers && path.resolve(options.handlers) || path.join(options.basedir || path.dirname(caller()), 'handlers');
    }

    routes = buildroutes(options);

    return routes;
}

module.exports = swaggerize;
