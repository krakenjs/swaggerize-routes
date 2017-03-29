'use strict';

var assert = require('assert'),
    thing = require('core-util-is'),
    enjoi = require('enjoi'),
    utils = require('./utils');


module.exports = function validator(options) {
    var schemas, types;

    schemas = {};
    types = {
        file: enjoi({
            type: 'object',
            properties: {
                value: {
                    type: 'string',
                    minLength: 0,
                    required: true
                },
                consumes: {
                    type: 'array',
                    items: {
                        type: 'string',
                        pattern: /multipart\/form-data|application\/x-www-form-urlencoded/,
                    },
                    required: true
                },
                in: {
                    type: 'string',
                    pattern: /formData/,
                    required: true
                }
            }
        })
    };

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
        makeAll: function (validators, route) {
            var self = this;

            return Object.keys(validators).map(function (k) {
                var parameter = validators[k];

                return self.make(parameter, route.consumes);
            });
        },

        /**
         * Creates a parameter validator.
         * @param parameter
         * @returns {Function}
         */
        make: function (parameter, consumes) {
            var schema, coerce, template;

            if (parameter.$ref) {
                parameter = refresolver(schemas, parameter.$ref);
            }

            coerce = coercion(parameter, consumes);

            template = {
                required: parameter.required,
                enum: parameter.enum,
                type: normalizetype(parameter.type),
                schema: parameter.schema,
                items: parameter.items,
                properties: parameter.properties,
                pattern: parameter.pattern,
                format: parameter.format,
                allowEmptyValue: parameter.allowEmptyValue,
                collectionFormat: parameter.collectionFormat,
                default: parameter.default,
                maximum: parameter.maximum,
                minimum: parameter.minimum,
                maxLength: parameter.maxLength,
                minLength: parameter.minLength,
                maxItems: parameter.maxItems,
                minItems: parameter.minItems,
                uniqueItems: parameter.uniqueItems,
                multipleOf: parameter.multipleOf
            };

            if ((parameter.in === 'body' || parameter.in === 'formData') && template.schema) {
                schema = enjoi(template.schema, {
                    subSchemas: schemas,
                    types: types
                });
            }
            else {
                schema = enjoi(template, {
                    subSchemas: schemas,
                    types: types
                });
            }

            if (parameter.required) {
                schema = schema.required();
            }

            if (parameter.in !== 'body' && parameter.allowEmptyValue){
              schema = schema.allow('').optional();
            }

            return {
                parameter: parameter,
                schema: schema,
                validate: function validateParameter(data, callback) {
                    coerce && data && (data = coerce(data));
                    schema.validate(data, function (error, result) {
                        if (error) {
                            error.message = error.message.replace('value', parameter.name);

                            error.details.forEach(function (detail) {
                                detail.message = detail.message.replace('value', parameter.name);
                                detail.path = parameter.name;
                            });

                            utils.debuglog('%s', error.message);
                            callback(error);
                            return;
                        }

                        callback(null, result || data);
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
function coercion(parameter, consumes) {
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
            fn = function(data) {
                return (data === 'true') || (data === '1') || (data === true);
            };
            break;
        case 'date':
        case 'dateTime':
            fn = Date.parse;
            break;
        case 'file': {
            fn = function (data) {
                return {
                    value: data,
                    consumes: consumes,
                    in: parameter.in
                };
            };
            break;
        }
    }

    if (!fn && parameter.schema) {
        fn = function (data) {
            if (thing.isObject(data) && !Object.keys(data).length) {
                return undefined;
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
