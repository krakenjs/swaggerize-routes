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

    t.test('input coerce to boolean (pass)', function (t) {
        t.plan(1);

        validator.make({
            name: 'id',
            required: true,
            type: 'boolean'
        }).validate(1, function (error) {
            t.ok(!error, 'no error.');
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

});
