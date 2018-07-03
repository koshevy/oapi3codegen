/// <reference path="custom-typings.d.ts" />

// Node.js construction
const path = require('path');
const fs = require('fs');

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
    ConvertorConfig,
    defaultConfig as defaultConvertorConfig,
    ApiMetaInfo
} from './core';

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

const prettierOptions = {
    parser: 'typescript',
    bracketSpacing: true,
    singleQuote: true
};

// *****************
// *** CLI Arguments for Convrtor`s config

const convertorConfig: ConvertorConfig = _.mapValues(
    defaultConvertorConfig,
    (v, k) => getArvgParam(k) || v
);

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

/**
 * Path for models and types.
 */
const typingsPathAbs = path.resolve(
    destPathAbs,
    convertorConfig.typingsDirectory
);

const servicesPathAbs = path.resolve(
    destPathAbs,
    convertorConfig.servicesDirectory
);

// ******************
// *** Implementation

const convertor: Convertor = new Convertor(convertorConfig);

const metaInfo: ApiMetaInfo[] = [];

const apiServiceTemplate = _.template(require('oapi3codegen-agent-angular/templates')
    .get('api-service')
    .toString());

// work with URL
if(srcPath.match(/^https?:/)) {
    download(srcPath).then(data => {
        const oapiData = JSON.parse(data.toString());
        convertor.loadOAPI3Structure(oapiData);
        executeCliAction(oapiData);
    });
} else {

    // Absolute url to path from CWD
    const srcPathAbs = path.resolve(process.cwd(), srcPath);

    if(!fsExtra.pathExistsSync(srcPathAbs))
        throw new Error(`File ${srcPathAbs} is not exists!`);

    const data = JSON.parse(fs.readFileSync(
        path.resolve(
            process.cwd(), srcPath
        ),
        'utf8'
    ));

    // work with files
    convertor.loadOAPI3Structure(data);

    executeCliAction(data);
}

function executeCliAction(oapiData) {

    const context = {};
    const entryPoints = convertor.getOAPI3EntryPoints(context, metaInfo);
    const summaryTextPieces = [];

    /**
     * Immutable value of array intended to collect
     * all affected models at all recursive levels.
     * @type {any[]}
     */
    let alreadyRendered: DataTypeDescriptor[] = [];

    const baseFileName = path.parse(srcPath).name;
    const newOapiFilePath = path.resolve(
        servicesPathAbs,
        `${baseFileName}.json`
    );

    oapiData.$id = `${baseFileName}.json`;

    fsExtra.outputFile(
        newOapiFilePath,
        JSON.stringify(oapiData)
    );

    // saving angular services
    _.each(metaInfo, (metaInfoItem: ApiMetaInfo) => {
        const serviceFileName = path.resolve(
            servicesPathAbs,
            `./${_.kebabCase(metaInfoItem.baseTypeName)}.service.ts`
        );

        metaInfoItem.apiSchemaFile = baseFileName;
        metaInfoItem.typingsDirectory = path.join(
            '../',
            convertorConfig.typingsDirectory
        );

        // metaInfoItem.mockData =
        const responseDescriptor = convertor.convert(
            metaInfoItem.responseSchema,
            context,
            metaInfoItem.responseModelName,
            metaInfoItem.responseModelName,
            null,
            []
        );

        if (responseDescriptor[0] &&
            responseDescriptor[0] instanceof ObjectTypeScriptDescriptor
        ) {
            const responseModel = <ObjectTypeScriptDescriptor>responseDescriptor[0];
            metaInfoItem.mockData = responseModel.getExampleValue();
        }

        metaInfoItem = _.mapValues(metaInfoItem, (v, k) => {
            switch (k) {
                case 'typingsDependencies':
                    return _.map(v, t => !t ? 'null' : t).join(', ');
                case 'path':
                case 'method':
                case 'queryParams':
                case 'servers':
                case 'responseSchema':
                case 'requestSchema':
                case 'paramsSchema':
                case 'mockData':
                    return JSON.stringify(v).replace(
                        /"#\/components/g,
                        `"${baseFileName}.json#/components`
                    );
            }

            return v || 'null';
        });

        const serviceRendered = apiServiceTemplate(metaInfoItem);

        fsExtra.outputFile(
            serviceFileName,
            prettier.format(
                serviceRendered,
                prettierOptions
            )
        );
    });

    /**
     * Rendering each type:
     * it could be saved into common file or different
     * files depending on the `--separatedFiles` option value.
     */
    Convertor.renderRecursive(
        entryPoints,
        (descriptor, text) => {

            /*
            fixme experimental code test
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
            */

            // Single file
            if (!separatedFiles) {
                summaryTextPieces.push(
                    prettier.format(
                        text,
                        prettierOptions
                    ));
            } else {

                const outputFilePath = path.resolve(
                    typingsPathAbs,
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
                        prettierOptions
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

        const outputFilePath = path.resolve(typingsPathAbs, `${fileInfo['name']}.ts`);

        fsExtra.outputFile(
            outputFilePath,
            prettier.format(
                summaryTextPieces.join('\n'),
                prettierOptions
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
            path.resolve(typingsPathAbs, `./index.ts`),
            prettier.format(
                _.map(indexItems, v => `export * from './${v}'`).join(';\n'),
                prettierOptions
            )
        );
    }
}
