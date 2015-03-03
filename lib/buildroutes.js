'use strict';

var utils = require('./utils'),
    validation = require('./validator'),
    readhandlers = require('./readhandlers'),
    path = require('path');

/**
 * Convert definition of api to something we can work with.
 * @param options
 * @returns {Array}
 */
function buildroutes(options) {
    var api, routes, handlers, validator, schemax;

    api = options.api;
    schemax = options['schema-extensions'];
    handlers = !schemax ? readhandlers(options.handlers) : undefined;
    validator = validation(options);

    routes = [];

    Object.keys(api.paths).forEach(function (path) {
        var def = options.api.paths[path];

        utils.verbs.forEach(function (verb) {
            var route, pathnames, operation;

            operation = def[verb];

            if (!operation) {
                return;
            }

            route = {
                path: path,
                name: operation.operationId,
                description: operation.description,
                method: verb,
                security: operation.security || def.security,
                validators: [],
                handler : undefined,
                produces: operation.produces
            };

            if (operation.parameters) {
                operation.parameters.forEach(function (parameter) {
                    route.validators.push(validator.make(parameter));
                });
            }

            pathnames = [];

            //Figure out the names from the params.
            path.split('/').forEach(function (element) {
                if (element) {
                    pathnames.push(element);
                }
            });

            if (schemax) {
                route.handler = operation['x-handler'] || def['x-handler'] && resolve(options.basedir, operation['x-handler'] || def['x-handler']);
            }
            if (!route.handler) {
                route.handler = handlers && matchpath('$' + verb, pathnames, handlers[pathnames[0]]);
            }

            route.handler && routes.push(route);
        });
    });

    return routes;
}

/**
 * Match a route handler to a given path name set.
 * @param method
 * @param pathnames
 * @param handlers
 * @returns {*}
 */
function matchpath(method, pathnames, handlers) {
    if (!handlers) {
        return null;
    }
    if (pathnames.length > 1) {
        pathnames.shift();
        return matchpath(method, pathnames, handlers[pathnames[0]]);
    }

    return handlers[pathnames[0]] ? handlers[pathnames[0]] : handlers[method];
}

function resolve(basedir, pathname) {
    pathname = path.resolve(basedir, pathname);

    return require(pathname);
}

module.exports = buildroutes;
