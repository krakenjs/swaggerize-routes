const Assert = require('assert');
const Thing = require('core-util-is');
const { isString, isObject } = Thing;
const Path = require('path');
const Caller = require('caller');
const Parser = require('swagger-parser');
const Maybe = require('call-me-maybe');
const Buildroutes = require('./builders/routes');

const Swaggerize = ( options = {}, callback) => {
    let routeObj;
    let { api, validated, basedir, handlers } = options;
    //api should be a valid string path or an object
    Assert.ok(isString(api) || isObject(api), 'Expected an api definition.');
    // if basedir is truthy, it should be a valid option.
    if (basedir) {
        Assert.ok(isString(basedir), 'Expected basedir to be a string.');
        Assert.ok(basedir.length, 'Expected basedir to be a non-empty string.');
    }
    //If basedir is falsy, Use the default basedir.
    basedir = basedir || Path.dirname(Caller());
    //If handlers is truthy, it should be a valid option.
    if (handlers) {
        Assert.ok(isString(handlers) || isObject(handlers), 'Expected handlers to be a string or an object.');
        Assert.ok(!isString(handlers) || handlers.length, 'Expected handlers to be a non-empty string.');
    }
    //If handlers is false, resolve path to handlers
    handlers = handlers || './handlers';
    //For string handlers, resolve to basedir
    if (Thing.isString(handlers) && Path.resolve(handlers) !== handlers) {
        // Relative path, so resolve to basedir
        handlers = Path.join(basedir, handlers);
    }
    //If the api is not yet validated, do it here
    routeObj = Buildroutes((!validated) ? Parser.validate(api) : Promise.resolve(api), Object.assign({}, options, { basedir, handlers }));

    return Maybe(callback, routeObj);
};

module.exports = Swaggerize;
