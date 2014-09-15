'use strict';

var assert = require('assert'),
    tv4 = require('tv4'),
    thing = require('core-util-is'),
    path = require('path'),
    caller = require('caller'),
    utils = require('./utils'),
    url = require('url'),
    buildroutes = require('./buildroutes');

function swaggerize(options) {
    var basePath, routes, schemaValidator, swaggerSchema;

    assert.ok(thing.isObject(options), 'Expected options to be an object.');
    assert.ok(thing.isObject(options.api), 'Expected an api definition.');
    assert.ok(!options.schemas || thing.isArray(options.schemas), 'Expected schemas option to be an array.');

    options.basedir = options.basedir || path.dirname(caller());

    swaggerSchema = require(path.join(__dirname, 'schema/swagger-spec/schemas/v2.0/schema.json'));
    schemaValidator = tv4.freshApi();

    assert.ifError(schemaValidator.validate(options.api, swaggerSchema).error);

    schemaValidator = tv4.freshApi();

    schemaValidator.addSchema('#', options.api);

    if (options.schemas) {
        options.schemas.forEach(function (schema) {
            assert.ok(thing.isObject(schema), 'Expected schema option to be an object.');
            assert.ok(thing.isString(schema.name), 'Expected schema name to be a string.');
            assert.ok(schema.name && schema.name !== '#', 'Schema name can not be base schema.');
            assert.ok(thing.isString(schema.schema) || thing.isObject(schema.schema), 'Expected schema to to an object.');

            utils.unsuffix(schema.name, '#');

            if (thing.isString(schema.schema)) {
                schema.schema = require(path.resolve(options.basedir, schema.schema));
            }

            schemaValidator.addSchema(schema.name, schema.schema);
        });
    }

    options.schemaValidator = schemaValidator;

    if (thing.isString(options.handlers) || !options.handlers) {
        options.handlers = options.handlers && path.resolve(options.handlers) || path.join(options.basedir, 'handlers');
    }

    routes = buildroutes(options);

    return routes;
}

module.exports = swaggerize;
