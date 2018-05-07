import * as path from 'path';
import * as _ from 'lodash';
import * as prettier from 'prettier';
import * as fsExtra from 'fs-extra';

import { Convertor } from './adapters/typescript';

const convertor: Convertor = new Convertor();
convertor.loadStructureFromFile(path.resolve(
    './mock/sample-schema-1.json'
));

let context = {};
let entryPoints = convertor.getEntryPoints(context);

let summaryText = [];
let alreadyRendered = [];

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
