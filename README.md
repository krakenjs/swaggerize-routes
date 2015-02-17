swaggerize-builder
==================

Lead Maintainer: [Trevor Livingston](https://github.com/tlivings/)  

[![Build Status](https://travis-ci.org/krakenjs/swaggerize-builder.svg?branch=master)](https://travis-ci.org/krakenjs/swaggerize-builder)   
[![NPM version](https://badge.fury.io/js/swaggerize-builder.png)](http://badge.fury.io/js/swaggerize-builder)  

`swaggerize-builder` is a component used by [swaggerize-express](https://github.com/krakenjs/swaggerize-express) and [swaggerize-hapi](https://github.com/krakenjs/swaggerize-hapi) for parsing and building route definitions based on a [Swagger 2.0 document](https://github.com/wordnik/swagger-spec/blob/master/versions/2.0.md).

`swaggerize-builder` provides the following features:

- Schema validation.
- Building route definitions from a Swagger 2.0 document.
- Validation helpers for input parameters.

### Usage

```javascript
var builder = require('swaggerize-builder');

var routes = builder({
    api: require('./api.json'),
    handlers: './handlers'
}));
```

Options:

- `api` - a valid Swagger 2.0 object.
- `handlers` - either a directory structure for route handlers or a premade object (see *Handlers Object* below).
- `basedir` - base directory to search for `handlers` path (defaults to `dirname` of caller).
- `schemas` - an array of `{name: string, schema: string|object}` representing additional schemas to add to validation.

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

### Handlers Object

The directory generation will yield this object, but it can be provided directly as `options.handlers`.

Note that if you are programatically constructing a handlers obj this way, you must namespace HTTP verbs with `$` to
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

### Route Object

The `routes` array returned from the call to the builder will contain `route` objects. Each `route` has the following properties:

- `path` - same as `path` from `api` definition.
- `name` - same as `operationId` in `api` definition.
- `description` - same as `description` in `path` for `api` definition.
- `method` - same as `method` from `api` `operation` definition.
- `validators` - an array of validation objects created from each `parameter` on the `operation`.
- `handler` - a handler function appropriate to the target framework (e.g express).
- `produces` - same as `produces` in `path` for `api` definition.

### Validator Object

The validator object in the `validators` array will have the following properties:

- `parameter` - same as the `parameter` from the operation on `path`.
- `validate(value, callback)` - a function for validating the input data against the `parameter` definition.
- `schema` - the `joi` schema being validated against.
