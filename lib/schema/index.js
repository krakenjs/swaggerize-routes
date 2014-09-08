'use strict';

var tv4 = require('tv4'),
    assert = require('assert'),
    fs = require('fs'),
    thing = require('core-util-is'),
    path = require('path');

var cache, schemaPath, baseSchemaPath, baseSchema, modelSchema;

cache = {};
schemaPath = path.join(__dirname, 'swagger-spec/schemas/v1.2');
baseSchemaPath = path.join(schemaPath, 'apiDeclaration.json');
modelSchema = require(path.join(schemaPath, 'modelsObject'));

assert.ok(fs.existsSync(schemaPath));
assert.ok(fs.existsSync(baseSchemaPath));

baseSchema = require(baseSchemaPath);

fs.readdirSync(schemaPath).forEach(function (file) {
    var schema;

    schema = require(path.join(schemaPath, file));
    cache[file] = schema;

    tv4.addSchema(schema);
});

module.exports = {
    /**
     * Validate against an optional schema, defaulting to base api schema.
     * @param data
     * @param schema
     * @returns {*}
     */
    validate: function validate(data, schema) {
        var results;

        if (thing.isString(schema)) {
            schema = cache[schema];
        }

        results = tv4.validateResult(data, schema || baseSchema, true);

        return results;
    }
};
