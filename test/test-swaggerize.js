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
