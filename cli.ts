/// <reference path="custom-typings.d.ts" />

import * as path from 'path';
import * as _ from 'lodash';
import * as prettier from 'prettier';
import * as fsExtra from 'fs-extra';
import { getArvgParam } from './lib';

import { Convertor } from './adapters/typescript';
import { DataTypeDescriptor } from './core';

// *****************
// *** CLI Arguments

// Source OpenAPI-file (.json)
const srcPath = getArvgParam('srcPath');

// Directory which will contain generated files
const destPath = getArvgParam('destPath');

// Whether should models output in separated files
const separatedFiles = getArvgParam('separatedFiles') || false;

if(!srcPath)
     throw new Error('--srcPath is not set!');

// Absolute url to path from CWD
const srcPathAbs = path.resolve(process.cwd(), srcPath);

const destPathAbs = destPath
    ? path.resolve(process.cwd(), destPath)
    : path.resolve(process.cwd(), './generated-code');

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
let alreadyRendered: DataTypeDescriptor[] = [];

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
            let indexItems = [];
            // Different files
            _.each(
                alreadyRendered,
                (descr: DataTypeDescriptor) => {
                    let dependencies = [];

                    const modelText = descr.render(
                        dependencies,
                        true
                    );

                    const fileText = `${
                            _.map(
                                dependencies,
                                (dep: DataTypeDescriptor) =>
                                    `import { ${dep.modelName} } from './${_.kebabCase(dep.modelName)}.ts';`
                            ).join(';\n')
                        }\n\n${modelText}`;

                    const outputFilePath = path.resolve(
                        destPathAbs,
                        `${_.kebabCase(descr.modelName)}.ts`
                    );

                    indexItems.push(`${_.kebabCase(descr.modelName)}`);

                    console.log(`${descr.modelName} was saved in separated file: ${outputFilePath}`);

                    fsExtra.outputFile(
                        outputFilePath,
                        prettier.format(
                            fileText,
                            {parser: 'typescript'}
                        )
                    );
                }
            );

            // Index file
            fsExtra.outputFile(
                path.resolve(destPathAbs, `./index.ts`),
                prettier.format(
                    _.map(indexItems, v => `export * from './${v}'`).join(';\n'),
                    {parser: 'typescript'}
                )
            );
        }
    },
    alreadyRendered
);

console.log('Render complete. These types was created:');
_.each(alreadyRendered.sort(), v => console.log(v.toString()));

/**
 * Output render results into file(s)
 */

// Single file
if(!separatedFiles) {

    const fileInfo = path.parse(srcPathAbs);

    if(!fileInfo['name'])
        throw new Error(`Can't extract name if path in "${srcPathAbs}"`);

    const outputFilePath = path.resolve(destPathAbs, `${fileInfo['name']}.ts`);

    fsExtra.outputFile(
        outputFilePath,
        prettier.format(
            summaryTextPieces.join('\n'),
            {parser: 'typescript'}
        )
    );

    console.log(`Result was saved in single file: ${outputFilePath}`);
}
