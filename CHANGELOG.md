## v2.0.0

### Bugfixes

- #67 - swagger schema extensions (^x-) in info section are not allowed
- #63 - Incorrect property path on validation errors
- #73 - Validation for multiple $ref parameters doesn't work

### Features

- Use [swagger-parser](https://github.com/BigstickCarpet/swagger-parser) to validate the Swagger spec.
- The api is dereferenced (both remote and local $ref are dereferenced) using [swagger-parser](https://github.com/BigstickCarpet/swagger-parser) #40
- Use [JSON schema validator](https://github.com/mafintosh/is-my-json-valid) as the default validator. #30.
- Option to set `joischema` to `true` to use [Joi](https://github.com/hapijs/joi) schema validator. Uses [enjoi](https://github.com/tlivings/enjoi) - The json to joi schema converter - to build the validator functions.
- By default, validators are provided for `response` schema also (in addition to input `parameters`).
