// This file is required by karma.conf.js and loads recursively all the .spec and framework files
// import * as fs from 'fs';
// import * as path from 'path';

import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// import {
//     ApiServiceTemplateData,
//     createApiServiceWithTemplate
// } from './app/api/templates';

// Mock data for tests
// import {
//     findPets
// } from './app/api/mocks/template.data';

declare const require: any;

// Before tests: initialize mock services
// const findPetsTemplate = createApiServiceWithTemplate(findPets);

// fs.writeFileSync(
//     path.resolve(__dirname, './app/api/dist/find-pets.api.service.ts'),
//     findPetsTemplate
// );

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
