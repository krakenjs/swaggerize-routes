'use strict';

var assert = require('assert'),
    schema = require('./schema'),
    thing = require('core-util-is'),
    path = require('path'),
    caller = require('caller'),
    utils = require('./utils'),
    url = require('url'),
    buildroutes = require('./buildroutes');

function swaggerize(options) {
    var validation, basePath, routes, defaultdir;

    assert.ok(thing.isObject(options), 'Expected options to be an object.');
    assert.ok(thing.isObject(options.resources) || thing.isArray(options.resources), 'Expected a resources(s) definition (options.resources).');

    if (!thing.isArray(options.resources)) {
        options.resources = [options.resources];
    }

    defaultdir = caller();

    routes = [];

    options.resources.forEach(function (resource) {

        basePath = url.parse(resource.api.basePath);
        resource.api.resourcePath = utils.prefix(resource.api.resourcePath || '/', '/');
        basePath.path = basePath.pathname = resource.api.resourcePath;
        resource.api.basePath = url.format(basePath);
        resource.handlers = resource.handlers || options.handlers;

        validation = schema.validate(resource.api);

        assert.ifError(validation.error);

        if (thing.isString(resource.handlers) || !resource.handlers) {
            resource.handlers = resource.handlers && path.resolve(resource.handlers) || path.join(options.basedir || path.dirname(defaultdir), 'handlers');
        }

        Array.prototype.push.apply(routes, buildroutes(resource));
    });

    return routes;
}

module.exports = swaggerize;
module.exports.schema = schema;
