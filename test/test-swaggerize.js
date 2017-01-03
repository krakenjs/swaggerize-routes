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

    tester.test('fail for missing handler path', t => {

        routeBuilder = Swaggerize({
            api: require('./fixtures/defs/pets.json')
        });

        routeBuilder.catch( err => {
            t.ok(err);
            t.ok(err.code === 'ENOENT', 'Ok error code ENOENT for missing handler directory');
            t.ok(/^ENOENT: no such file or directory/.test(err.message), 'Ok error for missing handler directory');
            t.end();
        });
    });

    tester.test('api as an object', t => {

        routeBuilder = Swaggerize({
            api: require('./fixtures/defs/pets.json'),
            basedir: Path.join(__dirname, './fixtures')
        });

        routeBuilder.then( routeObj => {
            let { routes } = routeObj;
            t.ok(Thing.isArray(routes), 'returns array.');
            t.strictEqual(routes.length, 6, 'routes.length 6.');
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

        routeBuilder.then( routeObj => {
            let { routes } = routeObj;
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

        routeBuilder.then( routeObj => {
            let { routes } = routeObj;
            t.ok(Thing.isArray(routes), 'returns array.');
            t.strictEqual(routes.length, 6, 'routes.length 6.');
            t.end();
        }).catch( err => {
            t.error(err);
            t.end();
        });
    });

    tester.test('callback response', t => {

        Swaggerize({
            api: Path.join(__dirname, './fixtures/defs/pets.json'),
            basedir: Path.join(__dirname, './fixtures'),
            handlers: Path.join(__dirname, './fixtures/handlers')
        }, (err, routeObj) => {
            let { routes } = routeObj;
            t.error(err);
            t.ok(Thing.isArray(routes), 'returns array.');
            t.strictEqual(routes.length, 6, 'routes.length 6.');
            t.end();
        });
    });

});

Test('handlers', t => {

    t.test('absolute path', t => {

        Swaggerize({
            api: require('./fixtures/defs/pets.json'),
            handlers: Path.join(__dirname, './fixtures/handlers')
        }).then(routeObj => {
            let { api, routes } = routeObj;
            t.ok(api, 'Resolved api from absolute handler path');
            t.ok(routes, 'constructed routes from absolute handler path');
            t.end();
        }).catch(error => {
            t.error(error);
            t.end();
        });

    });

    t.test('relative path', t => {
        Swaggerize({
            api: require('./fixtures/defs/pets.json'),
            handlers: './fixtures/handlers'
        }).then(routeObj => {
            let { api, routes } = routeObj;
            t.ok(api, 'Resolved api from relative handler path');
            t.ok(routes, 'constructed routes from relative handler path');
            t.end();
        }).catch(error => {
            t.error(error);
            t.end();
        });

    });

    t.test('empty path', t => {
        Swaggerize({
            api: require('./fixtures/defs/pets.json'),
            basedir: Path.join(__dirname, './fixtures'),
            handlers: ''
        }).then(routeObj => {
            let { routes } = routeObj;
            t.ok(routes, 'constructed routes from empty handler path');
            t.end();
        }).catch(error => {
            t.error(error);
            t.end();
        });
    });

    t.test('relative path with basedir', t => {
        Swaggerize({
            api: require('./fixtures/defs/pets.json'),
            basedir: Path.join(__dirname, './fixtures'),
            handlers: './handlers'
        }).then(routeObj => {
            let { routes } = routeObj;
            t.ok(routes, 'constructed routes from relative handler path with basedir');
            t.end();
        }).catch(error => {
            t.error(error);
            t.end();
        });
    });

    t.test('basedir with no handlers property', t => {
        Swaggerize({
            api: require('./fixtures/defs/pets.json'),
            basedir: Path.join(__dirname, './fixtures')
        }).then(routeObj => {
            let { routes } = routeObj;
            t.ok(routes, 'constructed routes from basedir with no handlers property');
            t.end();
        }).catch(error => {
            t.error(error);
            t.end();
        });

    });

    t.test('handlers as object', t => {
        Swaggerize({
            api: require('./fixtures/defs/pets.json'),
            handlers: {
                get: function () {}
            }
        }).then(routeObj => {
            let { routes } = routeObj;
            t.ok(routes, 'constructed routes from handlers as object');
            t.end();
        }).catch(error => {
            t.error(error);
            t.end();
        });

    });
});
