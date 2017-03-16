const Thing = require('core-util-is');
const { isString, isArray } = Thing;
const Path = require('path');
const Assert = require('assert');
const Utils = require('../utils');

/**
 * Build the security definition for a route.
 *
 * @param routeSecurity - array - the security defined on this route.
 * @param securityDefinitions - object - securityDefinitions from the api.
 * @param options
 * @returns {*}
 */
const Buildsecurity = (routeSecurity, securityDefinitions, options) => {
    let securityObj = {};
    let { basedir, security } = options;

    if (!securityDefinitions || !routeSecurity || !isArray(routeSecurity)) {
        return undefined;
    }

    routeSecurity.forEach(routeDef => {
        //Iteretae over each security def for the route
        Object.keys(routeDef).forEach(defName => {
            let defObj = securityDefinitions[defName];
            Assert.ok(defObj, 'Unrecognized security definition (' + defName + ')');

            securityObj[defName] = {};
            //The value of security scheme is a list of scope names required for the execution
            securityObj[defName].scopes = routeDef[defName];
            //Validate the scope values
            securityObj[defName].scopes.forEach(scope => {
                Assert.ok(isString(scope) && Object.keys(defObj.scopes).indexOf(scope) > -1, `Unrecognized scope ( ${scope}).`);
            });

            if (security) {
                //Security options found
                //Resolve the security authorize handler path - basedir + options.security + securityDefinition name
                securityObj[defName].authorize = Utils.resolve(basedir, Path.join(security, defName + '.js'));
            }
            //'x-authorize' can override the 'security' options and default handlers.
            if (defObj['x-authorize']) {
                securityObj[defName].authorize = Utils.resolve(basedir, defObj['x-authorize']);
            }
        });
    });

    return securityObj;
};

module.exports = Buildsecurity;
