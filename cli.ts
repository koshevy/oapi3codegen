/// <reference path="custom-typings.d.ts" />

// Node.js construction
const path = require('path');

import * as _ from 'lodash';
import * as prettier from 'prettier';
import * as fsExtra from 'fs-extra';
import * as download from 'download';
import { getArvgParam } from './lib';

import {
    Convertor,
    ClassRenderer
} from './adapters/typescript';
import { ObjectTypeScriptDescriptor } from './adapters/typescript/descriptors/object';
import {
    DataTypeDescriptor,
    defaultConfig as defaultConvertorConfig
} from './core';

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

const destPathAbs = destPath
    ? path.resolve(process.cwd(), destPath)
    : path.resolve(process.cwd(), './generated-code');

// *****************
// *** CLI Arguments for Convrtor`s config

const convertorConfig = _.mapValues(
    defaultConvertorConfig,
    (v, k) => getArvgParam(k) || v
);

// ******************
// *** Implementation

const convertor: Convertor = new Convertor(convertorConfig);

// work with URL
if(srcPath.match(/^https?:/)) {
    download(srcPath).then(data => {
        convertor.loadOAPI3Structure(JSON.parse(data.toString()));
        executeCliAction();
    });
} else {

    // Absolute url to path from CWD
    const srcPathAbs = path.resolve(process.cwd(), srcPath);

    if(!fsExtra.pathExistsSync(srcPathAbs))
        throw new Error(`File ${srcPathAbs} is not exists!`);

    // work with files
    convertor.loadOAPI3StructureFromFile(path.resolve(
        process.cwd(), srcPath
    ));

    executeCliAction();
}

function executeCliAction() {

    const context = {};
    const entryPoints = convertor.getOAPI3EntryPoints(context);
    const summaryTextPieces = [];

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

            if (descriptor instanceof ObjectTypeScriptDescriptor){
                const classRenderer = new ClassRenderer(
                    <ObjectTypeScriptDescriptor>descriptor
                );

                const classCode = classRenderer.render();
                console.log(prettier.format(
                    classCode,
                    {parser: 'typescript'}
                ));
            }

            // Single file
            if (!separatedFiles) {
                summaryTextPieces.push(
                    prettier.format(
                        text,
                        {parser: 'typescript'}
                    ));
            } else {

                const outputFilePath = path.resolve(
                    destPathAbs,
                    `${_.kebabCase(descriptor.modelName)}.ts`
                );

                let dependencies = [];

                const modelText = descriptor.render(
                    dependencies,
                    true
                );

                const fileText = `${
                    _.map(
                        dependencies,
                        (dep: DataTypeDescriptor) =>
                            `import { ${dep.modelName} } from './${_.kebabCase(dep.modelName)}';`
                    ).join(';\n')
                    }\n\n${modelText}`;

                fsExtra.outputFile(
                    outputFilePath,
                    prettier.format(
                        fileText,
                        {parser: 'typescript'}
                    )
                );

                console.log(`${descriptor.modelName} was saved in separated file: ${outputFilePath}`);
            }
        },
        alreadyRendered
    );

    /**
     * Output render results into file(s)
     */

// Single file
    if (!separatedFiles) {

        const fileInfo = path.parse(srcPath);

        if (!fileInfo['name'])
            throw new Error(`Can't extract name if path in "${srcPath}"`);

        const outputFilePath = path.resolve(destPathAbs, `${fileInfo['name']}.ts`);

        fsExtra.outputFile(
            outputFilePath,
            prettier.format(
                summaryTextPieces.join('\n'),
                {parser: 'typescript'}
            )
        );

        console.log(`Result was saved in single file: ${outputFilePath}`);
        console.log('Render complete. These types was created:');
        _.each(alreadyRendered.sort(), v => console.log(v.toString()));
    } else {
        // creating index.ts file

        let indexItems = [];
        // Different files
        _.each(
            alreadyRendered,
            (descr: DataTypeDescriptor) => {
                indexItems.push(`${_.kebabCase(descr.modelName)}`);
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

}
