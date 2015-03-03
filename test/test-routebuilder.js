'use strict';

var test = require('tape'),
    path = require('path'),
    buildroutes = require('../lib/buildroutes');

test('routebuilder', function (t) {
    var routes, schemaValidator, api;

    api = require('./fixtures/defs/pets.json');

    t.test('build directory', function (t) {
        routes = buildroutes({ api: api, handlers: path.join(__dirname, 'fixtures/handlers')});

        t.strictEqual(routes.length, 4, 'added 4 routes.');

        routes.forEach(function (route) {
            t.ok(route.hasOwnProperty('method'), 'has method property.');
            t.ok(route.hasOwnProperty('description'), 'has validate property.');
            t.ok(route.hasOwnProperty('name'), 'has name property.');
            t.ok(route.hasOwnProperty('path'), 'has path property.');
            t.ok(route.hasOwnProperty('validators'), 'has before property.');
            t.ok(route.hasOwnProperty('handler'), 'has handler property.');
            t.ok(route.hasOwnProperty('produces'), 'has validate property.');
        });

        t.end();
    });

    t.test('build from x-handler', function (t) {
        routes = buildroutes({ api: api, basedir: path.join(__dirname, 'fixtures')});

        t.strictEqual(routes.length, 2, 'added 2 routes.');

        routes.forEach(function (route) {
            t.ok(route.hasOwnProperty('method'), 'has method property.');
            t.ok(route.hasOwnProperty('description'), 'has validate property.');
            t.ok(route.hasOwnProperty('name'), 'has name property.');
            t.ok(route.hasOwnProperty('path'), 'has path property.');
            t.ok(route.hasOwnProperty('validators'), 'has before property.');
            t.ok(route.hasOwnProperty('handler'), 'has handler property.');
            t.ok(route.hasOwnProperty('produces'), 'has validate property.');
        });

        t.end();
    });

    t.test('build with object', function (t) {
        routes = buildroutes({
            api: api,
            handlers: {
                'pets': {
                    $get: function () {},
                    $post: function () {},
                    '{id}': {
                        $get: function () {},
                        $delete: function () {}
                    }
                }
            },
            schemaValidator: schemaValidator
        });

        t.strictEqual(routes.length, 4, 'added 4 routes.');

        routes.forEach(function (route) {
            t.ok(route.hasOwnProperty('method'), 'has method property.');
            t.ok(route.hasOwnProperty('description'), 'has validate property.');
            t.ok(route.hasOwnProperty('name'), 'has name property.');
            t.ok(route.hasOwnProperty('path'), 'has path property.');
            t.ok(route.hasOwnProperty('validators'), 'has validators property.');
            t.ok(route.hasOwnProperty('handler'), 'has handler property.');
            t.ok(route.hasOwnProperty('produces'), 'has produces property.');
            t.ok(route.hasOwnProperty('consumes'), 'has consumes property.');
        });

        t.end();
    });

    t.test('route validators', function (t) {
        var route;

        route = routes[1];

        t.strictEqual(route.validators.length, 1, 'has a validator.');
        t.ok(typeof route.validators[0].parameter === 'object', 'has parameter object property.');
        t.ok(typeof route.validators[0].schema === 'object', 'has schema object property.');
        t.ok(typeof route.validators[0].validate === 'function', 'has validate fn property.');

        route.validators[0].validate({
            id: 0
        }, function (error, newvalue) {
            t.ok(error, 'validation failed.');
        });

        route.validators[0].validate({
            id: 0,
            name: 'Cat'
        }, function (error, newvalue) {
            t.ok(!error, 'validation passed.');
        });

        t.end();
    });

    t.test('bad dir', function (t) {
        t.plan(1);

        t.throws(function () {
            buildroutes({ api: api, handlers: 'asdf' });
        }, 'throws error for bad directory.');
    });

});
