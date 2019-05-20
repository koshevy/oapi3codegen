"use strict";
/**
 * Prepares environment for tests.
 * TypeScript —> Node.js file.
 */
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var _lodash = require("lodash");
/* tslint:disable no-implicit-dependencies */
var templates_1 = require("../projects/ng-api-service/src/lib/templates");
// Mock data for tests
var mock_template_data_1 = require("./app/mock-api/mock-template.data");
var _ = _lodash;
// Before tests: initialize mock services
var mockApiTemplate = templates_1.createApiServiceWithTemplate(mock_template_data_1.MockApiService);
fs.writeFileSync(path.resolve(__dirname, '../../app/mock-api/dist/mock.api.service.ts'), mockApiTemplate);
