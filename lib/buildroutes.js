'use strict';

var utils = require('./utils'),
    validation = require('./validator'),
    readhandlers = require('./readhandlers'),
    thing = require('core-util-is'),
    path = require('path'),
    assert = require('assert');

/**
 * Convert definition of api to something we can work with.
 * @param options
 * @returns {Array}
 */
function buildroutes(options) {
    var api, routes, handlers, validator;

    api = options.api;
    handlers = readhandlers(options.handlers);
    validator = validation(options);
    routes = [];

    Object.keys(api.paths).forEach(function (path) {
        var def = options.api.paths[path];

        utils.verbs.forEach(function (verb) {
            var route, pathnames, operation, validators;

            operation = def[verb];

            if (!operation) {
                return;
            }

            route = {
                path: path,
                name: operation.operationId,
                description: operation.description,
                method: verb,
                security: buildSecurity(options.basedir, api.securityDefinitions, operation.security || def.security),
                validators: [],
                handler : undefined,
                consumes: operation.consumes || api.consumes,
                produces: operation.produces || api.produces,
                json: operation.json || api.json,
                cache: operation.cache || api.cache,
                config: operation.config || api.config,
                jsonp: operation.jsonp || api.jsonp
            };

            validators = {};

            if (def.parameters) {
                def.parameters.forEach(function (parameter) {
                    validators[parameter.in + parameter.name] = parameter;
                });
            }

            if (operation.parameters) {
                operation.parameters.forEach(function (parameter) {
                    validators[parameter.in + parameter.name] = parameter;
                });
            }

            route.validators = validator.makeAll(validators, route);

            pathnames = [];

            //Figure out the names from the params.
            path.split('/').forEach(function (element) {
                if (element) {
                    pathnames.push(element);
                }
            });

            route.handler = handlers && (pathnames[0] ? matchpath('$' + verb, pathnames, handlers[pathnames[0]]) : handlers['$' + verb]);

            if (!route.handler) {
                route.handler = operation['x-handler'] || def['x-handler'];
                route.handler = route.handler && resolve(options.basedir, route.handler, verb);
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

/**
 * Build the security definition for this route.
 * @param basedir to search for x-authorize functions from.
 * @param securityDefinitions from the api.
 * @param routeSecurity the security defined on this route.
 * @returns {*}
 */
function buildSecurity(basedir, securityDefinitions, routeSecurity) {
    var security = {};

    if (!securityDefinitions || !routeSecurity || !thing.isArray(routeSecurity)) {
        return undefined;
    }

    routeSecurity.forEach(function (definition) {
        Object.keys(definition).forEach(function (type) {
            assert.ok(securityDefinitions[type], 'Unrecognized security definition (' + type + ')');

            security[type] = {};
            security[type].scopes = definition[type];

            security[type].scopes.forEach(function (scope) {
                assert.ok(thing.isString(scope) && Object.keys(securityDefinitions[type].scopes).indexOf(scope) > -1, 'Unrecognized scope (' + scope + ').');
            });

            if (securityDefinitions[type]['x-authorize']) {
                security[type].authorize = resolve(basedir, securityDefinitions[type]['x-authorize']);
            }
        });
    });

    return security;
}

/**
 * Resolve the given path into a function.
 * @param basedir to search from.
 * @param pathname to resolve.
 * @param method
 * @returns {*}
 */
function resolve(basedir, pathname, method) {
    var handler;
    try {
        //If the pathname is already a resolved function, return it.
        //In the case of x-handler and x-authorize, users can define 
        //external handler/authorize modules and functions OR override 
        //existing x-authorize functions.
        if (thing.isFunction(pathname)) {
            return pathname;
        }

        pathname = path.resolve(basedir, pathname);
        handler = require(pathname);

        if (thing.isFunction(handler)) {
            return handler;
        }

        return method && handler[method];
    }
    catch (error) {
        utils.debuglog('Could not find %s.', pathname);
        return;
    }
}

module.exports = buildroutes;
