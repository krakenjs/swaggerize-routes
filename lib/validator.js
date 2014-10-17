'use strict';

var thing = require('core-util-is'),
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

            return {
                parameter: parameter,
                schema: schema,
                validate: function validateParameter(data, callback) {
                    coerce && data && (data = coerce(data));

                    if (data === undefined || data === null) {
                        if (parameter.required) {
                            utils.debuglog('required parameter \'%s\' missing.', parameter.name);
                            callback(new Error(sformat('required parameter \'%s\' missing.', parameter.name)));
                            return;
                        }

                        callback(null);
                        return;
                    }

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
 * Returns a function that coerces a type.
 * Coercion of doubles and longs are not supported in Javascript and strings should be used instead for 64bit numbers.
 * @param type
 */
function coercion(parameter) {
    var fn;

    switch (parameter.type) {
        case 'array'  :
            fn = function (data) {
                var sep = pathsep(parameter.collectionFormat || 'csv');
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
