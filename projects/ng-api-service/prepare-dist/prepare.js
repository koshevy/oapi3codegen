"use strict";
/**
 * Prepares environment for tests.
 * TypeScript —> Node.js file.
 */
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var _lodash = require("lodash");
var templates_1 = require("./lib/templates");
// Mock data for tests
var template_data_1 = require("./lib/mocks/template.data");
var _ = _lodash;
// NPM-package data
var packageJson = require('../package.json');
var packageName = packageJson.name;
// Before tests: initialize mock services
var findPetsTemplate = templates_1.createApiServiceWithTemplate(template_data_1.FindPetsService);
fs.writeFileSync(path.resolve(__dirname, '../src/dist/find-pets.api.service.ts'), findPetsTemplate.replace(new RegExp(packageName + "/?(lib/)?", 'g'), '../lib/'));
fs.writeFileSync(path.resolve(__dirname, '../src/dist/index.ts'), 'export * from \'./find-pets.api.service\';\n');
