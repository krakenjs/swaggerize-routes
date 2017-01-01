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

### Usage

```javascript
var builder = require('swaggerize-routes');

var routes = builder({
    api: require('./api.json'),
    handlers: './handlers',
    security: './security' //Optional - security authorize handlers as per `securityDefinitions`
}));
```

Options:

- `api` - a valid Swagger 2.0 object.
- `handlers` - either a directory structure for route handlers or a premade object (see *Handlers Object* below).
- `defaulthandler` - a handler function appropriate to the target framework, if used this will be the default handler for all generated routes (see *Default handler* below).
- `basedir` - base directory to search for `handlers` path (defaults to `dirname` of caller).
- `schemas` - an array of `{name: string, schema: string|object}` representing additional schemas to add to validation.
- `security` - directory to scan for authorize handlers corresponding to `securityDefinitions`.

**Returns:** An array of the processed routes.

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

If the `options.handlers` and `options.defaulthandler` is empty, then they will be used exclusively.

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

### Default handler

The `options.defaulthandler` will set the handler function for all generated routes to one default handler.

``` javascript
var routes = builder({
    api: require('./api.json'),
    defaulthandler: function (req, reply) {
       reply('something');
    }
});
```


### Route Object

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

### Validator Object

The validator object in the `validators` array will have the following properties:

- `parameter` - same as the `parameter` from the operation on `path`.
- `validate(value, callback)` - a function for validating the input data against the `parameter` definition.
- `schema` - the `joi` schema being validated against.

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
