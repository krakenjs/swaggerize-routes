const assert = require('assert');
const thing = require('core-util-is');
const Joi = require('joi');
const enjoi = require('enjoi');
const utils = require('./utils');

const extensions = [
  {
    type: 'file',
    base: Joi.object({
      value: Joi.binary().required(true),
      consumes: Joi.array().items(
        Joi.string().regex(/multipart\/form-data|application\/x-www-form-urlencoded/),
      ).required(true),
      in: Joi.string().regex(/formData/).required(true),
    }),
  },
];

module.exports = function validator(options) {
  const schemas = {};

  schemas['#'] = options.api;

  // eslint-disable-next-line no-unused-expressions
  options.schemas && Object.keys(options.schemas).forEach((key) => {
    schemas[key] = options.schemas[key];
  });

  return {
    /**
         * Creates a parameter validator.
         * @param parameter
         * @returns {Function}
         */
    makeAll(validators, route) {
      const self = this;

      return Object.keys(validators).map((k) => {
        const parameter = validators[k];

        return self.make(parameter, route.consumes);
      });
    },

    /**
         * Creates a parameter validator.
         * @param parameter
         * @returns {Function}
         */
    make(parameter, consumes, stripUnknownProperties = false) {
      let schema;

      if (parameter.$ref) {
        // eslint-disable-next-line no-use-before-define, no-param-reassign
        parameter = refresolver(schemas, parameter.$ref);
      }

      // eslint-disable-next-line no-use-before-define
      const coerce = coercion(parameter, consumes);

      const template = {
        required: parameter.required,
        enum: parameter.enum,
        // eslint-disable-next-line no-use-before-define
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
        multipleOf: parameter.multipleOf,
      };

      if ((parameter.in === 'body' || parameter.in === 'formData') && template.schema) {
        schema = enjoi.schema(template.schema, {
          subSchemas: schemas,
          extensions,
        });
      } else {
        schema = enjoi.schema(template, {
          subSchemas: schemas,
          extensions,
        });
      }

      if (parameter.required) {
        schema = schema.required();
      }

      if (parameter.in !== 'body' && parameter.allowEmptyValue) {
        schema = schema.allow('').optional();
      }

      if (stripUnknownProperties) {
        schema = schema.unknown(false);
      }

      return {
        parameter,
        schema,
        validate: function validateParameter(value, callback) {
          // eslint-disable-next-line no-unused-expressions, no-param-reassign
          coerce && value && (value = coerce(value));
          const result = schema.validate(value, { stripUnknown: stripUnknownProperties });
          if (result && result.error) {
            result.error.message = result.error.message.replace('value', parameter.name);

            result.error.details.forEach((detail) => {
              // eslint-disable-next-line no-param-reassign
              detail.message = detail.message.replace('value', parameter.name);
              // eslint-disable-next-line no-param-reassign
              detail.path = [parameter.name];
            });
            utils.debuglog('%s', result.error.message);
            return callback(result.error);
          }

          return callback(null, result.value);
        },
      };
    },
  };
};

/**
 * Get the object the path references.
 * @param schemas
 * @param value
 * @returns {*}
 */
function refresolver(schemas, value) {
  let id; let refschema; let path; let fragment; let
    paths;

  // eslint-disable-next-line prefer-const
  id = value.substr(0, value.indexOf('#') + 1);
  // eslint-disable-next-line prefer-const
  path = value.substr(value.indexOf('#') + 1);

  if (id) {
    refschema = schemas[id] || schemas[id.substr(0, id.length - 1)];
  } else {
    refschema = schemas['#'];
  }

  assert.ok(refschema, `Can not find schema reference: ${value}.`);

  fragment = refschema;
  // eslint-disable-next-line prefer-const
  paths = Array.isArray(path) ? path : path.split('/');

  for (let i = 1; i < paths.length && fragment; i += 1) {
    fragment = typeof fragment === 'object' && fragment[paths[i]];
  }

  return fragment;
}

/**
 * Returns a function that coerces a type.
 * Coercion of doubles and longs are not supported in Javascript and strings should be used
 * instead for 64bit numbers.
 * @param type
 */
function coercion(parameter, consumes) {
  let fn;

  // eslint-disable-next-line default-case
  switch (parameter.type) {
    case 'array':
      fn = (data) => {
        let sep;

        if (Array.isArray(data)) {
          return data;
        }

        // eslint-disable-next-line no-use-before-define, prefer-const
        sep = pathsep(parameter.collectionFormat || 'csv');
        return data.split(sep);
      };
      break;
    case 'integer':
    case 'float':
    case 'long':
    case 'double':
      fn = (data) => {
        // eslint-disable-next-line no-restricted-globals
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
      // eslint-disable-next-line no-restricted-globals
      fn = (data) => (isNaN(data) ? Buffer.from(data)[0] : Number(data));
      break;
    case 'boolean':
      fn = (data) => (data === 'true') || (data === '1') || (data === true);
      break;
    case 'date':
    case 'dateTime':
      fn = Date.parse;
      break;
    case 'file': {
      fn = (data) => ({
        value: data,
        consumes,
        in: parameter.in,
      });
      break;
    }
  }

  if (!fn && parameter.schema) {
    fn = (data) => {
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

// eslint-disable-next-line consistent-return
function pathsep(format) {
  // eslint-disable-next-line default-case
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
