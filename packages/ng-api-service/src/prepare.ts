/**
 * TypeScript —> Node.js file.
 * Prepares environment for tests.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as prettier from 'prettier/standalone';
import * as prettierParserTS from 'prettier/parser-typescript';

import {
    ApiServiceTemplateData,
    // createApiServiceWithTemplate
} from './app/api/templates';

// Mock data for tests
import {
    FindPetsService
} from './app/api/mocks/template.data';

declare const RegExp, JSON;

// NPM-package data
const packageJson = require('../../package.json');
const packageName = packageJson.name;

const prettierOptions = {
    parser: 'typescript',
    bracketSpacing: true,
    singleQuote: true,
    plugins: [prettierParserTS]
};

export const createApiServiceWithTemplate: (data: ApiServiceTemplateData)
    => string = (data) => {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const templateFile = fs.readFileSync(path.resolve(__dirname, '../app/api/templates/api-service.mustache'));
    const template = _.template(templateFile.toString());
    return prettier.format(template(data), prettierOptions) as string;
};

// Before tests: initialize mock services
const findPetsTemplate = createApiServiceWithTemplate(FindPetsService) as any;

fs.writeFileSync(
    path.resolve(__dirname, '../app/api/dist/find-pets.api.service.ts'),
    findPetsTemplate.replace(new RegExp(packageName, 'g'), '..')
);

fs.writeFileSync(
    path.resolve(__dirname, '../app/api/dist/index.ts'),
    'export * from \'./find-pets.api.service\';\n'
);
