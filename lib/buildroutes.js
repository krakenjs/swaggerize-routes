'use strict';

var utils = require('./utils'),
    validation = require('./validation'),
    readhandlers = require('./readhandlers');

/**
 * Convert definition of api to something we can work with.
 * @param options
 * @returns {Array}
 */
function buildroutes(options) {
    var api, routes, handlers;

    api = options.api;
    handlers = readhandlers(options.handlers);

    routes = [];

    Object.keys(api.paths).forEach(function (path) {
        var def, models;

        def = options.api.paths[path];

        models = api.definitions;

        utils.verbs.forEach(function (verb) {
            var route, pathnames, model, operation;

            operation = def[verb];

            if (!operation) {
                return;
            }

            route = {
                path: path,
                name: operation.operationId,
                description: operation.description,
                method: verb,
                validators: [],
                handler: undefined,
                produces: operation.produces
            };

            model = models && models[operation.type] || operation.type;

            def.parameters && def.parameters.forEach(function (parameter) {
                var model = models && models[parameter.type];

                route.validators.push({
                    parameter: parameter,
                    validate: validation.input(parameter, model)
                });
            });

            pathnames = [];

            //Figure out the names from the params.
            path.split('/').forEach(function (element) {
                if (element) {
                    pathnames.push(element);
                }
            });

            route.handler = matchpath('$' + verb, pathnames, handlers[pathnames[0]]);

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

module.exports = buildroutes;
