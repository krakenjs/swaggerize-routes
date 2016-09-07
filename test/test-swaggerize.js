const Test = require('tape');
const Thing = require('core-util-is');
const Parser = require('swagger-parser');
const Swaggerize = require('../lib/index');
const Path = require('path');

Test('configure', tester => {
    let routeBuilder;
    tester.test('fail no options', t => {
        t.plan(1);
        t.throws(function () {
            Swaggerize();
        }, 'throws exception.');
    });

    tester.test('fail no api definition', t => {
        t.plan(1);

        t.throws(function () {
            Swaggerize({});
        }, 'throws exception.');
    });

    tester.test('bad api definition', t => {

        routeBuilder = Swaggerize({
            api: require('./fixtures/defs/badapi.json'),
            basedir: Path.join(__dirname, './fixtures')
        });

        routeBuilder.catch( err => {
            t.ok(err);
            t.ok(err.name === 'SyntaxError', 'Ok error name for bad api definition');
            t.ok(/not a valid Swagger API definition$/.test(err.message), 'Ok error for bad api definition');
            t.end();
        });
    });

    tester.test('only the api', t => {

        routeBuilder = Swaggerize({
            api: require('./fixtures/defs/pets.json')
        });

        routeBuilder.then( routes => {
            t.ok(Thing.isArray(routes), 'returns array.');
            t.strictEqual(routes.length, 0, 'routes.length 0.');
            t.end();
        }).catch( err => {
            t.error(err);
            t.end();
        });
    });

    tester.test('api as an object', t => {

        routeBuilder = Swaggerize({
            api: require('./fixtures/defs/pets.json'),
            basedir: Path.join(__dirname, './fixtures')
        });

        routeBuilder.then( routes => {
            t.ok(Thing.isArray(routes), 'returns array.');
            t.strictEqual(routes.length, 2, 'routes.length 2.');
            t.end();
        }).catch( err => {
            t.error(err);
            t.end();
        });
    });

    tester.test('api path', t => {

        routeBuilder = Swaggerize({
            api: Path.join(__dirname, './fixtures/defs/pets.json'),
            basedir: Path.join(__dirname, './fixtures'),
            handlers: Path.join(__dirname, './fixtures/handlers')
        });

        routeBuilder.then( routes => {
            t.ok(Thing.isArray(routes), 'returns array.');
            t.strictEqual(routes.length, 6, 'routes.length 6.');
            t.end();
        }).catch( err => {
            t.error(err);
            t.end();
        });
    });

    tester.test('fail wrong api path', t => {

        routeBuilder = Swaggerize({
            api: 'wrongpath'
        });

        routeBuilder.catch( err => {
            t.ok(err);
            t.ok(err.code === 'ENOENT', 'Ok error for wrong path');
            t.end();
        });
    });

    tester.test('validated api', t => {

        let apiResolver = Parser.validate(Path.join(__dirname, './fixtures/defs/pets.json'));
        routeBuilder = Swaggerize({
            validated: true,
            api: apiResolver,
            basedir: Path.join(__dirname, './fixtures'),
            handlers: Path.join(__dirname, './fixtures/handlers')
        });

        routeBuilder.then( routes => {
            t.ok(Thing.isArray(routes), 'returns array.');
            t.strictEqual(routes.length, 6, 'routes.length 6.');
            t.end();
        }).catch( err => {
            t.error(err);
            t.end();
        });
    });

});

Test('handlers', t => {

    t.test('absolute path', t => {
        t.plan(1);

        t.doesNotThrow(function () {
            Swaggerize({
                api: require('./fixtures/defs/pets.json'),
                handlers: Path.join(__dirname, './fixtures/handlers')
            });
        });
    });

    t.test('relative path', t => {
        t.plan(1);

        t.doesNotThrow(function () {
            Swaggerize({
                api: require('./fixtures/defs/pets.json'),
                handlers: './fixtures/handlers'
            });
        });
    });

    t.test('empty path', t => {
        t.plan(1);

        t.doesNotThrow(function () {
            Swaggerize({
                api: require('./fixtures/defs/pets.json'),
                handlers: ''
            });
        });
    });

    t.test('relative path with basedir', t => {
        t.plan(1);

        t.doesNotThrow(function () {
            Swaggerize({
                api: require('./fixtures/defs/pets.json'),
                basedir: Path.join(__dirname, './fixtures'),
                handlers: './handlers'
            });
        });
    });

    t.test('basedir with no handlers property', t => {
        t.plan(1);

        t.doesNotThrow(function () {
            Swaggerize({
                api: require('./fixtures/defs/pets.json'),
                basedir: Path.join(__dirname, './fixtures')
            });
        });
    });

    t.test('handlers as object', t => {
        t.plan(1);

        t.doesNotThrow(function () {
            Swaggerize({
                api: require('./fixtures/defs/pets.json'),
                handlers: {
                    get: function () {}
                }
            });
        });
    });
});
