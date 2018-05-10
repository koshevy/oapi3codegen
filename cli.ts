/// <reference path="custom-typings.d.ts" />

import * as path from 'path';
import * as _ from 'lodash';
import * as prettier from 'prettier';
import * as fsExtra from 'fs-extra';
import { getArvgParam } from './lib';

import { Convertor } from './adapters/typescript';

// *****************
// *** CLI Arguments

// Source OpenAPI-file (.json)
const srcPath = getArvgParam('srcPath');

// Directory which will contain generated files
const destPath = getArvgParam('destPath')
    || path.resolve(process.cwd(), './generated-code');

// Whether should models output in separated files
const separatedFiles = getArvgParam('separatedFiles') || false;

if(!srcPath)
     throw new Error('--srcPath is not set!');

// Absolute url to path from CWD
const srcPathAbs = path.resolve(process.cwd(), srcPath);

if(!fsExtra.pathExistsSync(srcPathAbs))
    throw new Error(`File ${srcPathAbs} is not exists!`);

// ******************
// *** Implementation

const convertor: Convertor = new Convertor();
convertor.loadOAPI3StructureFromFile(path.resolve(
    process.cwd(), srcPath
));

let context = {};
let entryPoints = convertor.getOAPI3EntryPoints(context);

let summaryTextPieces = [];

/**
 * Immutable value of array intended to collect
 * all affected models at all recursive levels.
 * @type {any[]}
 */
let alreadyRendered = [];

/**
 * Rendering each type:
 * it could be saved into common file or different
 * files depending on the `--separatedFiles` option value.
 */
Convertor.renderRecursive(
    entryPoints,
    (descriptor, text) => {
        // Single file
        if(!separatedFiles) {
            summaryTextPieces.push(
                prettier.format(
                    text,
                    {parser: 'typescript'}
                ));
        } else {
            // Different files

        }
    },
    alreadyRendered
);

/**
 * Output render results into file(s)
 */

// Single file
if(!separatedFiles) {

    const fileInfo = path.parse(srcPathAbs);
    if(!fileInfo['name'])
        throw new Error(`Can't extract name if path in "${srcPathAbs}"`);

    fsExtra.outputFile(
        path.resolve(destPath, `${fileInfo['name']}.ts`),
        prettier.format(
            summaryTextPieces.join('\n'),
            {parser: 'typescript'}
        )
    );
} else {
    // Different files
}

console.log('Render complete. These types was created:');
_.each(alreadyRendered.sort(), v => console.log(v.toString()));
