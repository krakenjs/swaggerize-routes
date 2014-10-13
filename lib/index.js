'use strict';

var assert = require('assert'),
    enjoi = require('enjoi'),
    thing = require('core-util-is'),
    path = require('path'),
    caller = require('caller'),
    utils = require('./utils'),
    url = require('url'),
    buildroutes = require('./buildroutes');

function swaggerize(options) {
    var routes, schema, subSchemas;

    assert.ok(thing.isObject(options), 'Expected options to be an object.');
    assert.ok(thing.isObject(options.api), 'Expected an api definition.');
    assert.ok(!options.schemas || thing.isArray(options.schemas), 'Expected schemas option to be an array.');

    options.basedir = options.basedir || path.dirname(caller());

    if (options.schemas) {
        subSchemas = {};

        options.schemas.forEach(function (schema) {
            assert.ok(thing.isObject(schema), 'Expected schema option to be an object.');
            assert.ok(thing.isString(schema.name), 'Expected schema name to be a string.');
            assert.ok(schema.name && schema.name !== '#', 'Schema name can not be base schema.');
            assert.ok(thing.isString(schema.schema) || thing.isObject(schema.schema), 'Expected schema to to an object.');

            if (thing.isString(schema.schema)) {
                schema.schema = require(path.resolve(options.basedir, schema.schema));
            }

            subSchemas[schema.name] = schema.schema;
        });

        options.schemas = subSchemas;
    }

    schema = enjoi(require(path.join(__dirname, 'schema/swagger-spec/schemas/v2.0/schema.json')), subSchemas);

    schema.validate(options.api, function (error) {
        assert.ifError(error);
    });

    if (thing.isString(options.handlers) || !options.handlers) {
        options.handlers = options.handlers && path.resolve(options.handlers) || path.join(options.basedir, 'handlers');
    }

    routes = buildroutes(options);

    return routes;
}

module.exports = swaggerize;
