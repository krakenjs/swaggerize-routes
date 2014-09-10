'use strict';

var tv4 = require('tv4'),
    assert = require('assert'),
    fs = require('fs'),
    thing = require('core-util-is'),
    path = require('path');

var schemaPath, baseSchemaPath, baseSchema;

schemaPath = path.join(__dirname, 'swagger-spec/schemas/v2.0');
baseSchemaPath = path.join(schemaPath, 'schema.json');

assert.ok(fs.existsSync(schemaPath));
assert.ok(fs.existsSync(baseSchemaPath));

baseSchema = require(baseSchemaPath);

module.exports = {
    /**
     * Validate against an optional schema, defaulting to base api schema.
     * @param data
     * @param schema
     * @returns {*}
     */
    validate: function validate(data, schema) {
        var results;

        schema && assert.ok(thing.isObject(schema));

        results = tv4.validateResult(data, schema || baseSchema, true, false);

        return results;
    }
};
