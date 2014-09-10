'use strict';

var thing = require('core-util-is'),
    schema = require('./schema'),
    utils = require('./utils'),
    sformat = require('util').format;

/**
 * Creates validation middleware for a parameter.
 * @param parameter
 * @param model
 * @returns {validateInput}
 */
function inputValidator(parameter, model) {
    var coerce, validate;

    if (model === 'array') {
        model = { type: parameter.type, items: parameter.items };
    }

    validate = map(model || parameter.type);
    coerce = coercion(parameter);

    return function validateInput(value, callback) {
        value && coerce && (value = coerce(value));

        if (value === undefined || value === null) {
            if (parameter.required) {
                utils.debuglog('required parameter \'%s\' missing.', parameter.name);
                callback(new Error(sformat('required parameter \'%s\' missing.', parameter.name)));
                return;
            }
            callback(null, value);
            return;
        }

        if (validate) {
            validate(value, function (error) {
                var msg;
                if (error) {
                    msg = sformat('%s (at %s)', error.message, error.dataPath || '/');
                    utils.debuglog(msg);
                    callback(new Error(msg));
                    return;
                }

                callback(null, value);
            });

            return;
        }

        callback(null, value);
    };
}

/**
 * Create an output validator for the given model.
 * @param model
 * @returns {Function}
 */
function outputValidator(parameter, model) {
    var coerce, validate;

    if (model === 'array') {
        model = { type: parameter.type, items: parameter.items };
    }

    validate = map(model || parameter.type);
    coerce = coercion(parameter);

    return function validateOutput(data, callback) {
        var value;

        if (validate) {
            value = data && coerce ? coerce(data) : data;

            validate(value, function (error) {
                if (error) {
                    callback(error);
                    return;
                }
                callback(null);
            });
        }
    };
}

/**
 * Maps a type to a schema.
 * @param type
 * @returns {validate}
 */
function map(model) {

    return function validate(data, callback) {
        var value, result, error, actual, type;

        value = data;

        if (thing.isString(model) || (thing.isObject(model) && !thing.isObject(value))) {
            actual = typeof value;
            type = jsontype(model);

            if (actual !== type) {
                error = new Error(sformat('invalid type: %s (expected %s)', actual, thing.isObject(model) ? model.id || model['$ref'] : model));
            }
        }
        else {
            result = schema.validate(value, model);
            result.valid || (error = result.error);
        }

        callback(error);
    };
}

/**
 * Maps a type to a json type for primitive validation.
 * @param type
 * @returns string
 */
function jsontype(type) {
    switch (type) {
        case 'array':
            return 'array';
        case 'integer':
        case 'float':
        case 'long':
        case 'double':
        case 'byte':
            return 'number';
        case 'string':
            return 'string';
        case 'boolean':
            return 'boolean';
        default:
            return 'undefined';
    }
}

/**
 * Returns a function that coerces a type.
 * Coercion of doubles and longs are not supported in Javascript and strings should be used instead for 64bit numbers.
 * @param type
 */
function coercion(parameter) {
    var fn;

    switch (parameter.type) {
        case 'array':
            fn = function (data) {
                var sep;
                switch (parameter.collectionFormat || 'csv') {
                    case 'csv':
                        sep = ',';
                        break;
                    case 'ssv':
                        sep = ' ';
                        break;
                    case 'tsv':
                        sep = '\t';
                    case 'pipes':
                        sep = '|';
                        break;
                    case 'multi':
                        sep = '&';
                        break;
                }
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

module.exports.input = inputValidator;
module.exports.output = outputValidator;
