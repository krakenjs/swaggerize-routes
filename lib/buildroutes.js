const thing = require('core-util-is');
const path = require('path');
const assert = require('assert');
const utils = require('./utils');
const validation = require('./validator');
const readhandlers = require('./readhandlers');

/**
 * Convert definition of api to something we can work with.
 * @param options
 * @returns {Array}
 */
function buildroutes(options) {
  const { api } = options;
  const handlers = readhandlers(options.handlers);
  const { defaulthandler } = options;
  const validator = validation(options);
  const routes = [];

  // eslint-disable-next-line no-shadow
  Object.keys(api.paths).forEach((path) => {
    const def = options.api.paths[path];

    utils.verbs.forEach((verb) => {
      const pathnames = [];

      const operation = def[verb];

      if (!operation) {
        return;
      }

      const route = {
        path,
        name: operation.operationId,
        description: operation.description,
        method: verb,
        // eslint-disable-next-line max-len, no-use-before-define
        security: buildSecurity(options, api.securityDefinitions, operation.security || def.security || api.security),
        validators: [],
        handler: defaulthandler || undefined,
        consumes: operation.consumes || api.consumes,
        produces: operation.produces || api.produces,
        json: operation.json || api.json,
        cache: operation.cache || api.cache,
        config: operation.config || api.config,
        jsonp: operation.jsonp || api.jsonp,
      };

      const validators = {};

      if (def.parameters) {
        def.parameters.forEach((parameter) => {
          validators[parameter.in + parameter.name] = parameter;
        });
      }

      if (operation.parameters) {
        operation.parameters.forEach((parameter) => {
          validators[parameter.in + parameter.name] = parameter;
        });
      }

      route.validators = validator.makeAll(validators, route);

      // Figure out the names from the params.
      path.split('/').forEach((element) => {
        if (element) {
          pathnames.push(element);
        }
      });

      if (!route.handler) {
        // eslint-disable-next-line no-use-before-define
        route.handler = handlers && (pathnames[0] ? matchpath(`$${verb}`, pathnames, handlers[pathnames[0]]) : handlers[`$${verb}`]);
      }

      if (!route.handler) {
        route.handler = operation['x-handler'] || def['x-handler'];
        // eslint-disable-next-line no-use-before-define
        route.handler = route.handler && resolve(options.basedir, route.handler, verb);
      }

      // eslint-disable-next-line no-unused-expressions
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
function buildSecurity(options, securityDefinitions, routeSecurity) {
  const security = {};
  const { basedir } = options;

  if (!securityDefinitions || !routeSecurity || !thing.isArray(routeSecurity)) {
    return undefined;
  }

  routeSecurity.forEach((definition) => {
    Object.keys(definition).forEach((defName) => {
      assert.ok(securityDefinitions[defName], `Unrecognized security definition (${defName})`);

      security[defName] = {};
      // The value of security scheme is a list of scope names required for the execution
      security[defName].scopes = definition[defName];

      security[defName].scopes.forEach((scope) => {
        assert.ok(thing.isString(scope) && Object.keys(securityDefinitions[defName].scopes).indexOf(scope) > -1, `Unrecognized scope (${scope}).`);
      });

      if (options.security) {
        // Security options found
        // eslint-disable-next-line max-len
        // Resolve the security authorize handler path - basedir + options.security + securityDefinition name
        // eslint-disable-next-line no-use-before-define
        security[defName].authorize = resolve(basedir, path.join(options.security, `${defName}.js`));
      }
      // 'x-authorize' can override the 'security' options and default handlers.
      if (securityDefinitions[defName]['x-authorize']) {
        // eslint-disable-next-line no-use-before-define
        security[defName].authorize = resolve(basedir, securityDefinitions[defName]['x-authorize']);
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
// eslint-disable-next-line consistent-return
function resolve(basedir, pathname, method) {
  let handler;
  try {
    // If the pathname is already a resolved function, return it.
    // In the case of x-handler and x-authorize, users can define
    // external handler/authorize modules and functions OR override
    // existing x-authorize functions.
    if (thing.isFunction(pathname)) {
      return pathname;
    }

    // eslint-disable-next-line no-param-reassign
    pathname = path.resolve(basedir, pathname);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    handler = require(pathname);

    if (thing.isFunction(handler)) {
      return handler;
    }

    return method && handler[method];
  } catch (error) {
    utils.debuglog('Could not find %s.', pathname);
  }
}

module.exports = buildroutes;
