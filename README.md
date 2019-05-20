# @codegena/codegena

Root project of `@codegena`-scope. Contains of root project with test
Angular-application, used as a integration testing system for child projects:

- `@codegena/oapi3ts`
- `@codegena/ng-api-service`
- `@codegena/oapi3ts-cli`

Environment of root project and sub-projects organized due the
[ng-packagr](https://www.npmjs.com/package/ng-packagr).

## Subprojects

#### @codegena/oapi3ts

Platform-agnostic solution of generating [OpenAPI 3](https://swagger.io/specification/)-based
specifications to TypeScript definitions (interfaces, enums, unions, generics, aliases).

#### @codegena/ng-api-service

Solution for automatized generating

#### @codegena/oapi3ts-cli

CLI-wrapper on `@codegena/oapi3ts`. Also works with `@codegena/oapi3ts-cli`.

## Instruction

### NPM-commands

#### Basic

- `npm run check` — Check (lint, prepare to tests and test) root project and subprojects before publish
- `npm run publish:ng-api-service` — Check and publish `@codegena/ng-api-service`

#### Other

- `npm run prepare:app` — Prepare root application for integration tests
- `npm run prepare:ng-api-service` — Prepare `@codegena/ng-api-service` for unit tests
- `npm run prepare` — Prepare root project and all subprojects for common test launch
- `npm run prepare` — Prepare root project and all subprojects for common test launch
- `npm run test` — Prepare and do tests of root project and subprojects
- `npm run lint` — Lint code of root project and subprojects
- `npm run lint` — Lint code of root project and subprojects