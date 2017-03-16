swaggerize-routes (formerly swaggerize-builder)
==================

Lead Maintainer: [Trevor Livingston](https://github.com/tlivings/)  

[![Build Status](https://travis-ci.org/krakenjs/swaggerize-routes.svg?branch=master)](https://travis-ci.org/krakenjs/swaggerize-routes)
[![NPM version](https://badge.fury.io/js/swaggerize-routes.png)](http://badge.fury.io/js/swaggerize-routes)  

`swaggerize-routes` is a component used by [swaggerize-express](https://github.com/krakenjs/swaggerize-express) and [swaggerize-hapi](https://github.com/krakenjs/swaggerize-hapi) for parsing and building route definitions based on a [Swagger 2.0 document](https://github.com/wordnik/swagger-spec/blob/master/versions/2.0.md).

`swaggerize-routes` provides the following features:

- Schema validation.
- Building route definitions from a Swagger 2.0 document.
- Validation helpers for input parameters.
- Validation helpers for response.

### Usage

```javascript
const builder = require('swaggerize-routes');

const routeBuilder = builder({
    api: require('./api.json'),
    handlers: './handlers',
    security: './security' //Optional - security authorize handlers as per `securityDefinitions`
}));

//Promise Style
routeBuilder.then(routeObj => {
    let { api, routes } = routeObj;
    // `api` is the resolved swagger api Object ($ref, both remote and local references are resolved)
    // `routes` - an array of routes corresponding to the swagger api `paths`.

}).catch(error => Assert.ifError(error));

//OR

// Callback style
builder({
    api: 'http://petstore.swagger.io/v2/swagger.json',
    handlers: './handlers',
    security: './security', //Optional - security authorize handlers as per `securityDefinitions`
    joischema: true //Set to true if `joischema` need to be used for validators.
}), (error, routes) => {
    Assert.ifError(error);
    let { api, routes } = routeObj;
    // `api` is the resolved swagger api Object ($ref and remote and local ref are resolved)
    // `routes` - an array of routes corresponding to the swagger api `paths`.
});

```

### API

`builder(options, [cb])`

* `options` - (*Object*) - (required) - Options to build the routes based on swagger api.

    - `api` - (*Object*) or (*String*) or (*Promise*) - (required) - api can be one of the following.
        - A relative or absolute path to the Swagger api document.
        - A URL of the Swagger api document.
        - The swagger api Object
        - A promise (or a `thenable`) that resolves to the swagger api Object.

    - `handlers` - (*Object*) or (*String*) - (required) - either a directory structure for route handlers or a pre-created object (see *Handlers Object* below). If `handlers` option is not provided, route builder will try to use the default `handlers` directory (only if it exists). If there is no `handlers` directory available, then the route builder will try to use the `x-handler` swagger schema extension.
    - `basedir` - (*String*) - (optional) - base directory to search for `handlers` path (defaults to `dirname` of caller).
    - `security` - (*String*) - (optional) - directory to scan for authorize handlers corresponding to `securityDefinitions`.
    - `validated` -  (*Boolean*) - (optional) - Set this property to `true` if the api is already validated against swagger schema and already dereferenced all the `$ref`. This is really useful to generate validators for parsed api specs. Default value for this is `false` and the api will be validated using [swagger-parser validate](https://github.com/BigstickCarpet/swagger-parser/blob/master/docs/swagger-parser.md#validateapi-options-callback).
    - `joischema` - (*Boolean*) - (optional) - Set to `true` if you want to use [Joi](https://github.com/hapijs/joi) schema based Validators. Swagvali uses [enjoi](https://github.com/tlivings/enjoi) - The json to joi schema converter - to build the validator functions, if `joischema` option is set to `true`.

* `callback` -  (*Function*) - (optional) - `function (error, mock)`. If a callback is not provided a `Promise` will be returned.


### Handlers Directory

The `options.handlers` option specifies a directory to scan for handlers. These handlers are bound to the api `paths` defined in the swagger document.

```
handlers
  |--foo
  |    |--bar.js
  |--foo.js
  |--baz.js
```

Will route as:

```
foo.js => /foo
foo/bar.js => /foo/bar
baz.js => /baz
```

### Path Parameters

The file and directory names in the handlers directory can also represent path parameters.

For example, to represent the path `/users/{id}`:

```shell
handlers
  |--users
  |    |--{id}.js
```

This works with directory names as well:

```shell
handlers
  |--users
  |    |--{id}.js
  |    |--{id}
  |        |--foo.js
```

To represent `/users/{id}/foo`.

### Schema Extensions for Handlers

An alternative to automatically determining handlers based on a directory structure, handlers can be specified for both paths and/or operations.

Example:

```json
{

    "/pets": {
        "x-handler": "handlers/pets.js"
    }
}
```

Or at the operation level:

```json
{

    "/pets": {
        "GET": {
            "x-handler": "handlers/pets.js"
        }
    }
}
```

These paths are relative to the `options.basedir` and are used as fallbacks for missing handlers from directory scan.

If the `options.handlers` is empty, then they will be used exclusively.

### Handlers File

Each provided javascript file should export an object containing functions with HTTP verbs as keys.

Example:

```javascript
module.exports = {
    get: function (...) { ... },
    put: function (...) { ... },
    ...
}
```

Where the function signature is a handler for the target framework (e.g. `express` or `hapi`).

Handlers specified by `x-handler` can also be of the form:

```javascript
module.exports = function (...) {
    ...
};
```

In the case where a different `x-handler` file is specified for each operation.

### Handlers Object

The directory generation will yield this object, but it can be provided directly as `options.handlers`.

Note that if you are programmatically constructing a handlers obj this way, you must namespace HTTP verbs with `$` to
avoid conflicts with path names. These keys should also be *lowercase*.

Example:

```javascript
{
    'foo': {
        '$get': function (...) { ... },
        'bar': {
            '$get': function (...) { ... },
            '$post': function (...) { ... }
        }
    }
    ...
}
```

Handler keys in files do *not* have to be namespaced in this way.

### Route Object response

The response route object has two properties - `api` and `routes`.

`api` is the resolved swagger api object. This has all the resolved $ref values - both local and remote references.

The `routes` array returned from the call to the builder will contain `route` objects. Each `route` has the following properties:

- `path` - same as `path` from `api` definition.
- `name` - same as `operationId` in `api` definition.
- `description` - same as `description` in `path` for `api` definition.
- `method` - same as `method` from `api` `operation` definition.
- `security` - the security definition for this route, either pulled from the operation level or path level.
- `validators` - an array of validation objects created from each `parameter` on the `operation`.
- `handler` - a handler function appropriate to the target framework (e.g express).
- `consumes` - same as `consumes` in `api` definition.
- `produces` - same as `produces` in `api` definition.

#### Validator Object

The validator object in the `validators` array will have the following properties:

- `validate(value, callback)` - a function for validating the input data against the `parameter` definition.
- `spec` - The schema of the parameter.
- `joischema` - The `joi` schema being validated against. This will be available only for the validators with option `joischema` set as `true`. By default the validator uses `is-my-json-valid` JSON schema validator and `joischema` property in validator object will be `undefined`.

### Security directory

The `options.security` option specifies a directory to scan for security authorize handlers. These authorize handlers are bound to the api `securityDefinitions` defined in the swagger document.

The name of the `securityDefinitions` should match the file name of the authorize handler.

For example, for the security definition :

```json
"securityDefinitions": {
    "default": {
        "type": "oauth2",
        "scopes": {
            "read": "read pets.",
            "write": "write pets."
        }
    },
    "secondary": {
        "type": "oauth2",
        "scopes": {
            "read": "read secondary pets.",
            "write": "write secondary pets."
        }
    }
}
```

The `options.security`, say `security` directory should have following files:

```
├── security
   ├── default.js
   ├── secondary.js

```

### Schema Extension for security authorize handler

An alternative approach to `options.security` option, is use swagger schema extension (^x-) and define `x-authorize` as part of the `securityDefinitions`.

```json
"securityDefinitions": {
    "default": {
        "type": "oauth2",
        "scopes": {
            "read": "read pets.",
            "write": "write pets."
        },
        "x-authorize": "security/default_authorize.js"
    },
    "secondary": {
        "type": "oauth2",
        "scopes": {
            "read": "read secondary pets.",
            "write": "write secondary pets."
        },
        "x-authorize": "security/secondary_authorize.js"
    }
}
```

`x-authorize` will override any resolved authorize handlers defined by `options.security`.

### Security Object

The security object in the `route` is an object containing keys corresponding to names found under the [Swagger Security Definitions](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#securityDefinitionsObject).

Under each key will be an object containing the following properties:

- `scopes` - an array of scopes accepted for this route.
- `authorize` - a function scanned from the authorize handlers defined by the `options.security` directory. Or this may be provided by defining a `x-authorize` attribute to the security definition.
