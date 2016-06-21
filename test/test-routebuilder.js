'use strict';

var test = require('tape'),
    path = require('path'),
    buildroutes = require('../lib/buildroutes');

test('routebuilder', function (t) {
    var routes, schemaValidator, api;

    api = require('./fixtures/defs/pets.json');

    t.test('build directory', function (t) {
        routes = buildroutes({ api: api, basedir: path.join(__dirname, 'fixtures'), handlers: path.join(__dirname, 'fixtures/handlers')});

        t.strictEqual(routes.length, 5, 'added 5 routes.');

        routes.forEach(function (route) {
            t.ok(route.hasOwnProperty('method'), 'has method property.');
            t.ok(route.hasOwnProperty('description'), 'has validate property.');
            t.ok(route.hasOwnProperty('name'), 'has name property.');
            t.ok(route.hasOwnProperty('path'), 'has path property.');
            t.ok(route.hasOwnProperty('security'), 'has security property.');
            t.ok(route.hasOwnProperty('validators'), 'has before property.');
            if(route.method === 'get' && route.path === '/pets'){
              t.ok(route.jsonp === 'callback', 'options property is the right one.');
              t.ok(route.cache.statuses.join(',') === '200', 'options property is the right one.');
              t.ok(route.config.plugins.policies.join(', ') === 'isLoggedIn, addTracking, logThis', 'options property is the right one.');
            }
            t.ok(route.hasOwnProperty('handler'), 'has handler property.');
            t.ok(route.hasOwnProperty('produces'), 'has validate property.');
        });

        t.end();
    });

    t.test('build from x-handler', function (t) {
        routes = buildroutes({ api: api, basedir: path.join(__dirname, 'fixtures')});

        t.strictEqual(routes.length, 3, 'added 3 routes.');

        routes.forEach(function (route) {
            t.ok(route.hasOwnProperty('method'), 'has method property.');
            t.ok(route.hasOwnProperty('description'), 'has validate property.');
            t.ok(route.hasOwnProperty('name'), 'has name property.');
            t.ok(route.hasOwnProperty('path'), 'has path property.');
            t.ok(route.hasOwnProperty('security'), 'has security property.');
            t.ok(route.hasOwnProperty('validators'), 'has before property.');
            t.ok(route.hasOwnProperty('handler'), 'has handler property.');
            t.ok(route.hasOwnProperty('produces'), 'has validate property.');
        });

        t.end();
    });

    t.test('build with object', function (t) {
        routes = buildroutes({
            api: api,
            basedir: path.join(__dirname, 'fixtures'),
            handlers: {
                'pets': {
                    $get: function () {},
                    $post: function () {},
                    '{id}': {
                        $get: function () {},
                        $delete: function () {},
                        'items': {
                            $get: function () {},
                            $post: function () {}
                        }
                    }
                }
            },
            schemaValidator: schemaValidator
        });

        t.strictEqual(routes.length, 7, 'added 7 routes.');

        routes.forEach(function (route) {
            t.ok(route.hasOwnProperty('method'), 'has method property.');
            t.ok(route.hasOwnProperty('description'), 'has validate property.');
            t.ok(route.hasOwnProperty('name'), 'has name property.');
            t.ok(route.hasOwnProperty('path'), 'has path property.');
            t.ok(route.hasOwnProperty('security'), 'has security property.');
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

    t.test('route validator merge', function(t) {
        var route;
        route = routes[5];
        t.strictEqual(route.validators.length, 3, 'has 3 validators.');

        var validator;
        validator = route.validators.filter(function (validator) {return validator.parameter.name === 'date'}).shift();
        t.ok(validator.parameter.required, 'override by operation.');

        route = routes[6];
        t.strictEqual(route.validators.length, 4, 'has 4 validators.');

        t.end();
    });

    t.test('security definitions', function (t) {
        var route;

        t.plan(3);

        route = routes[1];

        t.ok(route.security, 'has security definition');
        t.ok(route.security.default && Array.isArray(route.security.default.scopes), 'has scopes.');
        t.ok(route.security.default && typeof route.security.default.authorize === 'function', 'has an authorize function.');
    });

    t.test('bad dir', function (t) {
        t.plan(1);

        t.throws(function () {
            buildroutes({ api: api, handlers: 'asdf' });
        }, 'throws error for bad directory.');
    });

    t.test('build with root path', function (t) {
        var routes = buildroutes({
            api: require('./fixtures/defs/testroot.json'),
            basedir: path.join(__dirname, 'fixtures'),
            handlers: {
                $get: function () {},
                other: {
                    $get: function () {}
                }
            }
        });

        t.strictEqual(routes.length, 2, 'added 1 routes.');

        routes.forEach(function (route) {
            t.ok(route.hasOwnProperty('method'), 'has method property.');
            t.ok(route.hasOwnProperty('description'), 'has validate property.');
            t.ok(route.hasOwnProperty('name'), 'has name property.');
            t.ok(route.hasOwnProperty('path'), 'has path property.');
            t.ok(route.hasOwnProperty('security'), 'has security property.');
            t.ok(route.hasOwnProperty('validators'), 'has validators property.');
            t.ok(route.hasOwnProperty('handler'), 'has handler property.');
            t.ok(route.hasOwnProperty('produces'), 'has produces property.');
            t.ok(route.hasOwnProperty('consumes'), 'has consumes property.');
        });

        t.end();
    });

});
