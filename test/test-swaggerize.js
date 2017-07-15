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

    t.test('bad api definition', function (t) {
        t.plan(1);

        t.throws(function () {
            swaggerize({
                api: require('./fixtures/defs/badapi.json'),
                basedir: path.join(__dirname, './fixtures')
            });
        }, 'throws exception.');
    });

    t.test('api', function (t) {
        t.plan(2);

        var routes = swaggerize({
            api: require('./fixtures/defs/pets.json'),
            basedir: path.join(__dirname, './fixtures')
        });

        t.ok(thing.isArray(routes), 'returns array.');
        t.strictEqual(routes.length, 5, 'routes.length 5.');
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
            });
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
            });
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
            });
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
            });
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
            });
        });
    });

});


test('handlers', function (t) {

    t.test('absolute path', function(t) {
        t.plan(1);

        t.doesNotThrow(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                handlers: path.join(__dirname, './fixtures/handlers')
            });
        });
    });

    t.test('relative path', function(t) {
        t.plan(1);

        t.doesNotThrow(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                handlers: './fixtures/handlers'
            });
        });
    });

    t.test('empty path', function(t) {
        t.plan(1);

        t.throws(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                handlers: ''
            });
        });
    });

    t.test('relative path with basedir', function(t) {
        t.plan(1);

        t.doesNotThrow(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                basedir: path.join(__dirname, './fixtures'),
                handlers: './handlers'
            });
        });
    });

    t.test('basedir with no handlers property', function(t) {
        t.plan(1);

        t.doesNotThrow(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                basedir: path.join(__dirname, './fixtures')
            });
        });
    });

    t.test('handlers as object', function(t) {
        t.plan(1);

        t.doesNotThrow(function () {
            swaggerize({
                api: require('./fixtures/defs/pets.json'),
                handlers: {
                    $get: function () {}
                }
            });
        });
    });


});
