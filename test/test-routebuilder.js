'use strict';

var test = require('tape'),
    path = require('path'),
    buildroutes = require('../lib/buildroutes');

test('routebuilder', function (t) {
    var routes, schemaValidator, api;

    api = require('./fixtures/defs/pets.json');

    t.test('build directory', function (t) {
        routes = buildroutes({
            api: api,
            basedir: path.join(__dirname, 'fixtures'),
            handlers: path.join(__dirname, 'fixtures/handlers'),
            security: path.join(__dirname, 'fixtures/extensions')
        });

        t.strictEqual(routes.length, 4, 'added 4 routes.');

        routes.forEach(function (route) {
            t.notEqual(route.method, 'has method property.');
            t.notEqual(route.description, undefined, 'has validate property.');
            t.notEqual(route.name, undefined, 'has name property.');
            t.notEqual(route.path, undefined, 'has path property.');
            t.notEqual(route.security, undefined, 'has security property.');
            t.notEqual(route.validators, undefined, 'has before property.');
            if(route.method === 'get' && route.path === '/pets'){
              t.ok(route.jsonp === 'callback', 'options property is the right one.');
              t.ok(route.cache.statuses.join(',') === '200', 'options property is the right one.');
              t.ok(route.config.plugins.policies.join(', ') === 'isLoggedIn, addTracking, logThis', 'options property is the right one.');
            }
            t.notEqual(route.handler, undefined, 'has handler property.');
            t.notEqual(route.produces, undefined, 'has validate property.');
        });

        t.end();
    });

    t.test('security definitions', function (t) {
        var route;

        t.plan(5);

        route = routes[1];
        t.ok(route.security, 'has security definition');
        t.ok(route.security.default && Array.isArray(route.security.default.scopes), 'default has scopes.');
        t.ok(route.security.default && typeof route.security.default.authorize === 'function', 'default has an authorize function.');
        //options.security
        t.ok(route.security.secondary && Array.isArray(route.security.secondary.scopes), 'secondary has scopes.');
        t.ok(route.security.secondary && typeof route.security.secondary.authorize === 'function', 'secondary has an authorize function.');
    });

    t.test('build from x-handler', function (t) {
        routes = buildroutes({ api: api, basedir: path.join(__dirname, 'fixtures')});

        t.strictEqual(routes.length, 2, 'added 2 routes.');

        routes.forEach(function (route) {
            t.notEqual(route.method, undefined, 'has method property.');
            t.notEqual(route.description, undefined, 'has validate property.');
            t.notEqual(route.name, undefined, 'has name property.');
            t.notEqual(route.path, undefined, 'has path property.');
            t.notEqual(route.security, undefined, 'has security property.');
            t.notEqual(route.validators, undefined, 'has before property.');
            t.notEqual(route.handler, undefined, 'has handler property.');
            t.notEqual(route.produces, undefined, 'has validate property.');
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

        t.strictEqual(routes.length, 6, 'added 6 routes.');

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

        t.end();
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
            t.notEqual(route.method, undefined, 'has method property.');
            t.equal(route.description, undefined, 'has no description property.');
            t.notEqual(route.name, undefined, 'has name property.');
            t.notEqual(route.path, undefined, 'has path property.');
            t.equal(route.security, undefined, 'has no security property.');
            t.notEqual(route.validators, undefined, 'has validators property.');
            t.notEqual(route.handler, undefined, 'has handler property.');
            t.notEqual(route.produces, undefined, 'has produces property.');
            t.notEqual(route.consumes, undefined, 'has consumes property.');
        });

        t.end();
    });

});
