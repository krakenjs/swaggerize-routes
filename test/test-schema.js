'use strict';

var test = require('tape'),
    schema = require('../lib/schema');

test('schema', function (t) {
    var apiDefinition = require('./fixtures/defs/pets.json');

    t.test('good api', function (t) {
        t.plan(1);

        var results = schema.validate(apiDefinition);

        t.ok(results.valid, 'no errors');
    });

    t.test('bad api', function (t) {
        t.plan(2);

        var results = schema.validate(require('./fixtures/defs/badapi.json'));

        t.ok(!results.valid, 'bad');
        t.ok(results.error, 'has error.');
    });

    t.test('good model', function (t) {
        t.plan(1);

        var modelSchema = {
            'id': 'User',
            'required': ['id', 'name'],
            'properties': {
                'name': {
                    'type': 'string'
                },
                'id': {
                    'type': 'integer',
                    'format': 'int64'
                }
            }
        };

        var results = schema.validate({
            'id': 123,
            'name': 'John Doe'
        }, modelSchema);

        t.ok(results.valid, 'no errors');
    });

    t.test('bad model', function (t) {
        t.plan(2);

        var modelSchema = {
            'id': 'User',
            'required': ['id', 'name'],
            'properties': {
                'name': {
                    'type': 'string'
                },
                'id': {
                    'type': 'integer',
                    'format': 'int64'
                }
            }
        };

        var results = schema.validate({
            'id': 'asdf',
            'name': 'John Doe'
        }, modelSchema);

        t.ok(!results.valid, 'bad');
        t.ok(results.error, 'has error.');
    });

    t.test('validate by $ref model fail', function (t) {
        t.plan(2);

        var modelSchema = {
            '$ref': '#/definitions/Pet',
            'definitions': apiDefinition.definitions
        };

        var results = schema.validate({
            'id': 'asdf'
        }, modelSchema);

        t.ok(!results.valid, 'bad');
        t.ok(results.error, 'has error.');
    });

    t.test('validate by $ref model pass', function (t) {
        t.plan(2);

        var modelSchema = {
            '$ref': '#/definitions/Pet',
            'definitions': apiDefinition.definitions
        };

        var results = schema.validate({
            'id': 0,
            'name': 'Cat'
        }, modelSchema);

        t.ok(results.valid, 'pass');
        t.ok(!results.error, 'no error.');
    });


});
