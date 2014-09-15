'use strict';

var thing = require('core-util-is'),
    utils = require('./utils'),
    sformat = require('util').format;

/**
 * Creates a parameter validator.
 * @param validator
 * @param parameter
 * @returns {validate}
 */
module.exports = function validator(schemaValidator, parameter) {
    var coerce, schemaValidator, validate, model;

    if (parameter.in === 'body') {
        model = parameter.schema.$ref ? schemaValidator.getSchema(parameter.schema.$ref) : parameter.schema;
    }
    else {
        model = parameter.type !== 'array' ? parameter.type : { type: parameter.type, items: parameter.items };
        coerce = coercion(parameter);
    }

    return function validate(data, callback) {
        var value, result, error, actual, type;

        coerce && (data = coerce(data));

        if (data === undefined || data === null) {
            if (parameter.required) {
                utils.debuglog('required parameter \'%s\' missing.', parameter.name);
                callback(new Error(sformat('required parameter \'%s\' missing.', parameter.name)));
                return;
            }
            callback(null);
            return;
        }

        if (thing.isString(model) || (thing.isObject(model) && !thing.isObject(data))) {
            actual = typeof data;
            type = jsontype(model);

            if (actual !== type) {
                error = new Error(sformat('invalid type: %s (expected %s)', actual, parameter.type));
            }
        }
        else {
            result = schemaValidator.validateResult(data, model);
            result.valid || (error = result.error);
        }

        if (error) {
            utils.debuglog('%s (at %s)', error.message, error.dataPath || '/');
            callback(error);
            return;
        }

        callback(null, data);
    };
};

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

    switch (parameter.type) {
        case 'array':
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
