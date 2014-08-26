[![Build Status](https://travis-ci.org/krakenjs/swaggerize-builder.png)](https://travis-ci.org/krakenjs/swaggerize-builder) [![NPM version](https://badge.fury.io/js/swaggerize-builder.png)](http://badge.fury.io/js/swaggerize-builder)

# swaggerize-builder

- **Version:** `1.0.0-rc.1`
- **Stability:** `unstable`
- **Changelog:** [https://github.com/krakenjs/swaggerize-builder/blob/master/CHANGELOG.md](https://github.com/krakenjs/swaggerize-builder/blob/master/CHANGELOG.md)

`swaggerize-builder` is a component used by [swaggerize-express](https://github.com/krakenjs/swaggerize-express) for parsing and building route definitions based on a [Swagger document](https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md).

`swaggerize-builder` provides the following features:

- Schema validation.
- Building route definitions from a Swagger document.

### Usage

```javascript
var builder = require('swaggerize-builder');

builder({
    api: require('./api.json'),
    docspath: '/api-docs',
    handlerspath: './handlers'
}));
```

Options:

- `api` - a valid Swagger 1.2 document.
- `docspath` - the path to expose api docs for swagger-ui, etc. Defaults to `/`.
- `handlers` - either a directory structure for route handlers or a premade object (see *Handlers Object* below).

### Handlers Directory

```
handlers
  |--foo
  |    |--bar.js
  |--foo.js
  |--baz.js
```

Matches:

- `foo.js : /foo`
- `foo/bar.js : /foo/bar`
- `baz.js : /baz`

### Path Parameters

The file and directory names in the handlers directory can represent path parameters.

For example, to represent the path `/users/{id}`:

```shell
handlers
  |--users
  |    |--{id}.js
```

This works with sub-resources as well:

```shell
handlers
  |--users
  |    |--{id}.js
  |    |--{id}
  |        |--foo.js
```

To represent `/users/{id}/foo`.

### Handlers File

Each provided javascript file should follow the format of:

```javascript
module.exports = {
    get: function (...) { ... },
    put: function (...) { ... },
    ...
}
```

Where each http method has a handler for the target framework (e.g. express).

### Handlers Object

The directory generation will yield this object, but it can be provided directly as `options.handlers` as well:

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

Note that if you are programatically constructing a handlers obj, you must namespace *http methods* with `$` to
avoid conflicts with path names. These keys should also be *lowercase*.

Handler keys in files do *not* have to be namespaced in this way.

### Contribution

In order to run the swaggerize-builder unit tests, execute the following commands:

```bash
$ git submodule update --init --recursive
$ npm install
$ npm test
```
