'use strict';

var test = require('tape'),
    thing = require('core-util-is'),
    swaggerize = require('../lib/index'),
    path = require('path');

test('configure', function (t) {

    t.test('fail no options', function (t) {
        t.plan(1);

        t.throws(function () {
            swaggerize();
        }, 'throws exception.');
    });

    t.test('fail no api definition', function (t) {
        t.plan(1);

        t.throws(function () {
            swaggerize({});
        }, 'throws exception.');
    });

    t.test('api', function (t) {
        t.plan(2);

        var routes = swaggerize({
            api: require('./fixtures/defs/pets.json'),
            basedir: path.join(__dirname, './fixtures')
        });

        t.ok(thing.isArray(routes), 'returns array.');
        t.strictEqual(routes.length, 4, 'routes.length 4.');
    });

});

test('additional schemas', function (t) {

    t.test('fails with bad types', function (t) {
        t.plan(1);

        t.throws(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                basedir: path.join(__dirname, './fixtures'),
                schemas: [
                    'a', 'b', 'c'
                ]
            })
        });
    });

    t.test('fails with missing name', function (t) {
        t.plan(1);

        t.throws(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                basedir: path.join(__dirname, './fixtures'),
                schemas: [
                    {}
                ]
            })
        });
    });

    t.test('fails with missing schema', function (t) {
        t.plan(1);

        t.throws(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                basedir: path.join(__dirname, './fixtures'),
                schemas: [
                    {name: 'models'}
                ]
            })
        });
    });

    t.test('fails with bad types', function (t) {
        t.plan(1);

        t.throws(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                basedir: path.join(__dirname, './fixtures'),
                schemas: [
                    {name: 'models', schema: 1}
                ]
            })
        });
    });

    t.test('fails with bad name', function (t) {
        t.plan(1);

        t.throws(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                basedir: path.join(__dirname, './fixtures'),
                schemas: [
                    {name: '#', schema: {}}
                ]
            })
        });
    });

    t.test('adds schema by path', function (t) {
        t.plan(2);

        var options = {
            api: require('./fixtures/defs/pets.json'),
            basedir: path.join(__dirname, './fixtures'),
            schemas: [
                {name: 'models', schema: path.join(__dirname, './fixtures/defs/models.json') }
            ]
        };

        var routes = swaggerize(options);

        t.ok(options.schemaValidator, 'has schemaValidator.');
        t.ok(options.schemaValidator.getSchema('models'), 'addition schema added.');
    });

    t.test('adds schema by object', function (t) {
        t.plan(2);

        var options = {
            api: require('./fixtures/defs/pets.json'),
            basedir: path.join(__dirname, './fixtures'),
            schemas: [
                {name: 'models', schema: {} }
            ]
        };

        var routes = swaggerize(options);

        t.ok(options.schemaValidator, 'has schemaValidator.');
        t.ok(options.schemaValidator.getSchema('models'), 'addition schema added.');
    });
});
