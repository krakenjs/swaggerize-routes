'use strict';

var assert = require('assert'),
    thing = require('core-util-is'),
    enjoi = require('enjoi'),
    utils = require('./utils'),
    sformat = require('util').format;


module.exports = function validator(options) {
    var schemas;

    schemas = {};

    schemas['#'] = options.api;

    options.schemas && Object.keys(options.schemas).forEach(function (key) {
        schemas[key] = options.schemas[key];
    });

    return {
        /**
         * Creates a parameter validator.
         * @param parameter
         * @returns {Function}
         */
        make: function (parameter) {
            var schema, coerce, template;

            if (parameter.$ref) {
                parameter = refresolver(schemas, parameter.$ref);
            }

            coerce = coercion(parameter);

            template = {
                required: parameter.required,
                enum: parameter.enum,
                type: normalizetype(parameter.type),
                schema: parameter.schema,
                items: parameter.items,
                properties: parameter.properties
            };

            if (parameter.in === 'body' && template.schema) {
                schema = enjoi(template.schema, schemas);
            }
            else {
                schema = enjoi(template, schemas);
            }

            if (parameter.required) {
                schema = schema.required();
            }

            return {
                parameter: parameter,
                schema: schema,
                validate: function validateParameter(data, callback) {
                    coerce && data && (data = coerce(data));

                    schema.validate(data, function (error) {
                        if (error) {
                            utils.debuglog('%s', error.message);
                            callback(error);
                            return;
                        }

                        callback(null, data);
                    });
                }
            };
        }
    };
};

/**
 * Get the object the path references.
 * @param schemas
 * @param value
 * @returns {*}
 */
function refresolver(schemas, value) {
    var id, refschema, path, fragment, paths;

    id = value.substr(0, value.indexOf('#') + 1);
    path = value.substr(value.indexOf('#') + 1);

    if (id) {
        refschema = schemas[id] || schemas[id.substr(0, id.length - 1)];
    }
    else {
        refschema = schemas['#'];
    }

    assert.ok(refschema, 'Can not find schema reference: ' + value + '.');

    fragment = refschema;
    paths = Array.isArray(path) ? path : path.split('/');

    for (var i = 1; i < paths.length && fragment; i++) {
        fragment = typeof fragment === 'object' && fragment[paths[i]];
    }

    return fragment;
}

/**
 * Returns a function that coerces a type.
 * Coercion of doubles and longs are not supported in Javascript and strings should be used instead for 64bit numbers.
 * @param type
 */
function coercion(parameter) {
    var fn;

    switch (parameter.type) {
        case 'array'  :
            fn = function (data) {
                var sep;

                if (Array.isArray(data)) {
                    return data;
                }
                
                sep = pathsep(parameter.collectionFormat || 'csv');
                return data.split(sep);
            };
            break;
        case 'integer':
        case 'float':
        case 'long':
        case 'double':
            fn = function (data) {
                if (isNaN(data)) {
                    return data;
                }
                return Number(data);
            };
            break;
        case 'string':
            fn = String;
            break;
        case 'byte':
            fn = function (data) {
                return isNaN(data) ? new Buffer(data)[0] : Number(data);
            };
            break;
        case 'boolean':
            fn = Boolean;
            break;
        case 'date':
        case 'dateTime':
            fn = Date.parse;
            break;
    }

    if (!fn && parameter.schema) {
        fn = function (data) {
            if (thing.isObject(data) && !Object.keys(data).length) {
                return null;
            }
            return data;
        };
    }

    return fn;
}

function normalizetype(type) {
    switch (type) {
        case 'long':
        case 'byte':
            return 'integer';
        case 'float':
        case 'double':
            return 'number';
        case 'date':
        case 'dateTime':
            return 'string';
        default:
            return type;
    }
}

function pathsep(format) {
    switch (format) {
        case 'csv':
            return ',';
        case 'ssv':
            return ' ';
        case 'tsv':
            return '\t';
        case 'pipes':
            return '|';
        case 'multi':
            return '&';
    }
}
