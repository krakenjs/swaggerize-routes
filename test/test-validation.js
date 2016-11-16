'use strict';

var test = require('tape'),
    validation = require('../lib/validator'),
    thing = require('core-util-is');

test('validation', function (t) {
    var validator = validation({
        api: require('./fixtures/defs/pets.json')
    });


    t.test('input pass', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'integer'
        }).validate(1, function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input pass with $ref', function (t) {
        t.plan(1);

        validator.make({
            $ref: '#/parameters/id'
        }).validate(1, function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input pass with pattern', function (t) {
        t.plan(2);

        var functionnalValidator = validator.make({
            name: 'id',
            required: true,
            type: 'string',
            pattern: '[0-9]+'
        });

        functionnalValidator.validate('1', function (error) {
            t.ok(!error, 'no error.');
        });

        functionnalValidator.validate('abc', function (error) {
            t.ok(error, 'error.');
        });
    });

    [true, false].forEach(function(isRequired){
        ['string', 'boolean', 'integer'].forEach(function(type){
            var requiredInTitle = isRequired? 'required ': 'not required ';

            t.test(requiredInTitle + type + ' param pass with allowEmptyValue', function(t){
                t.plan(1);

                validator.make({
                    name: 'param',
                    required: isRequired,
                    type: type,
                    allowEmptyValue: true
                }).validate('', function(error){
                    t.ok(!error, 'no error.');
                });
            });
        });
    });

    t.test('$ref default resolves to root schema', function (t) {
        t.plan(1);

        validator.make({
            $ref: '/parameters/id'
        }).validate(1, function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('failed to make validator with bad $ref', function (t) {
        t.plan(1);

        t.throws(function () {
            validator.make({
                $ref: '#/parameters/noexist'
            });
        });
    });


    t.test('input fail (not present)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'integer'
        }).validate(undefined, function (error) {
            t.ok(error, 'error.');
        });
    });

    t.test('input validation skip (not present, not required)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: false,
            type: 'integer'
        }).validate(undefined, function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input coerce to null from empty object', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            in: 'body',
            schema: {
                '$ref': '#/definitions/Pet'
            }
        }).validate({}, function (error) {
            t.ok(error, 'error.');
        });
    });

    t.test('input coerce to float (pass)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'float'
        }).validate('1.0', function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input coerce to byte (pass)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'byte'
        }).validate('a', function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input coerce to csv array (pass)', function (t) {
        t.plan(2);

        validator.make({
            name: 'id',
            required: true,
            type: 'array',
            items:  {
                type: 'string'
            }
        }).validate('a,b,c', function (error, value) {
            t.ok(!error, 'no error.');
            t.ok(thing.isArray(value), 'coerced to array.');
        });
    });

    t.test('input coerce to ssv array (pass)', function (t) {
        t.plan(2);

        validator.make({
            name: 'id',
            required: true,
            type: 'array',
            items: {
                type: 'string'
            },
            collectionFormat: 'ssv'
        }).validate('a b c', function (error, value) {
            t.ok(!error, 'no error.');
            t.ok(thing.isArray(value), 'coerced to array.');
        });
    });

    t.test('input coerce to tsv array (pass)', function (t) {
        t.plan(2);

        validator.make({
            name: 'id',
            required: true,
            type: 'array',
            items: { type: 'string' },
            collectionFormat: 'tsv'
        }).validate('a\tb\tc', function (error, value) {
            t.ok(!error, 'no error.');
            t.ok(thing.isArray(value), 'coerced to array.');
        });
    });

    t.test('input coerce to pipes array (pass)', function (t) {
        t.plan(2);

        validator.make({
            name: 'id',
            required: true,
            type: 'array',
            items: { type: 'string' },
            collectionFormat: 'pipes'
        }).validate('a|b|c', function (error, value) {
            t.ok(!error, 'no error.');
            t.ok(thing.isArray(value), 'coerced to array.');
        });
    });

    ['false', '0', false].forEach(function(value) {
        t.test('input coerce to boolean (pass) - value ' + value, function (t) {
            t.plan(2);

            validator.make({
                name: 'id',
                required: true,
                type: 'boolean'
            }).validate(value, function (error, result) {
                t.ok(!error, 'no error.');
                t.equal(result, false);
            });
        });
    });

    ['true', '1', true].forEach(function(value) {
        t.test('input coerce to boolean (pass) - value ' + value, function (t) {
            t.plan(2);

            validator.make({
                name: 'id',
                required: true,
                type: 'boolean'
            }).validate(value, function (error, result) {
                t.ok(!error, 'no error.');
                t.equal(result, true);
            });
        });
    });

    t.test('input coerce to string (pass)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'string'
        }).validate(1, function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input fail (bad type)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'integer'
        }).validate('hello', function (error) {
            t.ok(error, 'error.');
        });
    });

    t.test('input ignore extra value', function(t) {
        t.plan(2);

        var v = validator.make(require('./fixtures/defs/pets.json').definitions.Pet);

        v.schema._settings = {
          allowUnknown: true,
          stripUnknown: true
        };

        v.validate({ id: 1, name: 'fluffy', extra: 'foo'}, function(error, result) {
            t.ok(!error, 'no error.');
            t.ok(!result.extra, 'No extra properties')
        });
    });

    t.test('formData', function (t) {
        t.plan(1);

        validator.make({
            name: 'upload',
            type: 'file',
            in: 'formData'
        }, ['multipart/form-data']).validate('data', function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('formData field', function (t) {
        t.plan(1);

        validator.make({
            name: 'user_name',
            type: 'string',
            in: 'formData'
        }, ['multipart/form-data']).validate('data', function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('formData bad consumes', function (t) {
        t.plan(1);

        validator.make({
            name: 'upload',
            type: 'file',
            in: 'formData'
        }, ['application/json']).validate('data', function (error) {
            t.ok(error, 'error.');
        });
    });

});


test('named validation', function (t) {

  var validator = validation({
    api: require('./fixtures/defs/pets.json')
  });

  t.test('input fail (not present) includes parameter name', function (t) {
    t.plan(2);

    var parameterName = 'test_parameter_name_missing_required';

    validator.make({
      name: parameterName,
      required: true,
      type: 'integer'
    }).validate(undefined, function (error) {
      t.ok(error, 'error.');
      t.ok(error.message.indexOf(parameterName) >= 0, 'Expected error.message to contain ' + parameterName);
    });
  });

  t.test('input fail (bad type)', function (t) {
    t.plan(2);

    var parameterName = 'test_parameter_name_wrong_type';

    validator.make({
      name: parameterName,
      required: true,
      type: 'integer'
    }).validate('hello', function (error) {
      t.ok(error, 'error.');
      t.ok(error.message.indexOf(parameterName) >= 0, 'Expected error.message to contain ' + parameterName);
    });
  });

  t.test('input fail (not present) - parameter name in each details.message', function (t) {

    var parameterName = 'test_details_message_contains_parameter';

    validator.make({
      name: parameterName,
      required: true,
      type: 'integer'
    }).validate(undefined, function (error) {

      var numErrorDetails = error.details.length;

      t.plan(numErrorDetails + 1);
      t.ok(error, 'error.');
      error.details.forEach(function (detail) {
        t.ok(detail.message.indexOf(parameterName) >= 0, 'Expected error.details.message to contain ' + parameterName);
      });
    });
  });

  t.test('input fail (not present) - parameter name in each details.path', function (t) {

    var parameterName = 'test_details_path_equals_parameter';

    validator.make({
      name: parameterName,
      required: true,
      type: 'integer'
    }).validate(undefined, function (error) {

      var numErrorDetails = error.details.length;

      t.plan(numErrorDetails + 1);
      t.ok(error, 'error.');
      error.details.forEach(function (detail) {
        t.ok(detail.path === parameterName, 'Expected error.details.path to equal ' + parameterName);
      });
    });
  });

});
