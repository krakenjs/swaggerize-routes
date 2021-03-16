const assert = require('assert');
const enjoi = require('enjoi');
const thing = require('core-util-is');
const path = require('path');
const caller = require('caller');
const swaggerSchema = require('swagger-schema-official/schema');
const buildroutes = require('./buildroutes');

function swaggerize(options) {
  const schemas = {
    '#': swaggerSchema,
  };

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

  // eslint-disable-next-line no-param-reassign
  options.basedir = options.basedir || path.dirname(caller());

  // Map and validate API against schemas
  if (thing.isArray(options.schemas)) {
    options.schemas.forEach((schema) => {
      assert.ok(thing.isObject(schema), 'Expected schema option to be an object.');
      assert.ok(thing.isString(schema.name), 'Expected schema name to be a string.');
      assert.ok(schema.name && schema.name !== '#', 'Schema name can not be base schema.');
      assert.ok(thing.isString(schema.schema) || thing.isObject(schema.schema), 'Expected schema to to an object.');

      if (thing.isString(schema.schema)) {
        // eslint-disable-next-line global-require, no-param-reassign,import/no-dynamic-require
        schema.schema = require(path.resolve(options.basedir, schema.schema));
      }

      schemas[schema.name] = schema.schema;
    });
  }

  const result = enjoi.schema({
    type: 'object',
    schema: swaggerSchema,
  }, {
    subSchemas: schemas,
  }).validate(options.api);

  if (result && result.error) {
    assert.ifError(result.error);
  }

  // Resolve path to handlers
  // eslint-disable-next-line no-param-reassign
  options.handlers = options.handlers || './handlers';

  if (thing.isString(options.handlers) && path.resolve(options.handlers) !== options.handlers) {
    // Relative path, so resolve to basedir
    // eslint-disable-next-line no-param-reassign
    options.handlers = path.join(options.basedir, options.handlers);
  }

  return buildroutes(options);
}

module.exports = swaggerize;
