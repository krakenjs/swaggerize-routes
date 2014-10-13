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
        })(1, function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input fail (not present)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'integer'
        })(undefined, function (error) {
            t.ok(error, 'error.');
        });
    });

    t.test('input validation skip (not present, not required)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: false,
            type: 'integer'
        })(undefined, function (error) {
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
        })({}, function (error) {
            t.ok(error, 'no error.');
        });
    });

    t.test('input coerce to float (pass)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'float'
        })('1.0', function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input coerce to byte (pass)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'byte'
        })('a', function (error) {
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
        })('a,b,c', function (error, value) {
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
        })('a b c', function (error, value) {
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
        })('a\tb\tc', function (error, value) {
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
        })('a|b|c', function (error, value) {
            t.ok(!error, 'no error.');
            t.ok(thing.isArray(value), 'coerced to array.');
        });
    });

    t.test('input coerce to boolean (pass)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'boolean'
        })(1, function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input coerce to string (pass)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'string'
        })(1, function (error) {
            t.ok(!error, 'no error.');
        });
    });

    t.test('input fail (bad type)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'integer'
        })('hello', function (error) {
            t.ok(error, 'error.');
        });
    });

});
