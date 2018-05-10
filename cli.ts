/// <reference path="custom-typings.d.ts" />

import * as path from 'path';
import * as _ from 'lodash';
import * as prettier from 'prettier';
import * as fsExtra from 'fs-extra';
import { getArvgParam } from './lib';

import { Convertor } from './adapters/typescript';

// Source OpenAPI-file (.json)
const srcPath = getArvgParam('srcPath');

// Directory which will contain generated files
const destPath = getArvgParam('destPath')
    || path.resolve(process.cwd(), './generated-code');

if(!srcPath)
    throw new Error('--srcPath is not set!');

if(!fsExtra.pathExistsSync(srcPath))
    throw new Error(`File ${srcPath} is not exists!`);

const convertor: Convertor = new Convertor();
convertor.loadOAPI3StructureFromFile(path.resolve(
    process.cwd(), srcPath
));

let context = {};
let entryPoints = convertor.getOAPI3EntryPoints(context);

let summaryText = [];
let alreadyRendered = [];

/**
 * Rendering each type:
 * it could be saved into common file or different
 * files depending on the `--separatedFiles` option value.
 */
Convertor.renderRecursive(
    entryPoints,
    (descriptor, text) => {
        summaryText.push(prettier.format(text, {parser: 'typescript'}));
    },
    alreadyRendered
);

fsExtra.outputFile(
    '/DATA/plugin_projects/oapi3codegen/mock/working-example.ts',
    prettier.format(summaryText.join('\n'), {parser: 'typescript'})
);

console.log('Render complete. These types was created:');
_.each(alreadyRendered.sort(), v => console.log(v.toString()));
