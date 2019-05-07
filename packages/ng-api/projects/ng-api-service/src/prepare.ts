/**
 * Prepares environment for tests.
 * TypeScript —> Node.js file.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as _lodash from 'lodash';

import { createApiServiceWithTemplate } from './lib/templates';

// Mock data for tests
import { FindPetsService } from './lib/mocks/template.data';

const _ = _lodash;
declare const RegExp;

// NPM-package data
const packageJson = require('../package.json');
const packageName = packageJson.name;

// Before tests: initialize mock services
const findPetsTemplate = createApiServiceWithTemplate(FindPetsService) as any;

fs.writeFileSync(
    path.resolve(__dirname, '../src/prepare-dist/find-pets.api.service.ts'),
    findPetsTemplate.replace(new RegExp(`${packageName}\/?(lib\/)?`, 'g'), '../lib/')
);

fs.writeFileSync(
    path.resolve(__dirname, '../src/prepare-dist/index.ts'),
    'export * from \'./find-pets.api.service\';\n'
);
