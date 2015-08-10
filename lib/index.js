'use strict';

var assert = require('assert'),
    enjoi = require('enjoi'),
    thing = require('core-util-is'),
    path = require('path'),
    caller = require('caller'),
    utils = require('./utils'),
    buildroutes = require('./buildroutes'),
    swaggerSchema = require('swagger-schema-official/schema');


function swaggerize(options) {
    var schemas;

    assert.ok(thing.isObject(options), 'Expected options to be an object.');
    assert.ok(thing.isObject(options.api), 'Expected an api definition.');

    if ('basedir' in options) {
        assert.ok(thing.isString(options.basedir), 'Expected basedir to be a string.');
        assert.ok(options.basedir.length, 'Expected basedir to be a non-empty string.');
    }

    if ('schemas' in options) {
        assert.ok(thing.isArray(options.schemas), 'Expected schemas option to be an array.');
    }

    if ('handlers' in options) {
        assert.ok(thing.isString(options.handlers) || thing.isObject(options.handlers), 'Expected handlers to be a string or an object.');
        assert.ok(!thing.isString(options.handlers) || options.handlers.length, 'Expected handlers to be a non-empty string.');
    }

    options.basedir = options.basedir || path.dirname(caller());

    schemas = {
        '#': swaggerSchema
    };

    // Map and validate API against schemas
    if (thing.isArray(options.schemas)) {
        options.schemas.forEach(function (schema) {
            assert.ok(thing.isObject(schema), 'Expected schema option to be an object.');
            assert.ok(thing.isString(schema.name), 'Expected schema name to be a string.');
            assert.ok(schema.name && schema.name !== '#', 'Schema name can not be base schema.');
            assert.ok(thing.isString(schema.schema) || thing.isObject(schema.schema), 'Expected schema to to an object.');

            if (thing.isString(schema.schema)) {
                schema.schema = require(path.resolve(options.basedir, schema.schema));
            }

            schemas[schema.name] = schema.schema;
        });
    }

    enjoi(swaggerSchema, schemas).validate(options.api, function (error) {
        assert.ifError(error);
    });

    // Resolve path to handlers
    options.handlers = options.handlers || './handlers';

    if (thing.isString(options.handlers) && path.resolve(options.handlers) !== options.handlers) {
        // Relative path, so resolve to basedir
        options.handlers = path.join(options.basedir, options.handlers);
    }

    return buildroutes(options);
}


module.exports = swaggerize;
