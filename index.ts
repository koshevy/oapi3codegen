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

// _.each(entryPoints, descriptor => {
//     /*console.log*/(prettier.format(
//         descriptor.render(dependencies))
//     );
// });

let summaryText = '';
let alreadyRendered = [];

Convertor.renderRecursive(
    entryPoints,
    (descriptor, text) => {
        summaryText += prettier.format(text, {parser: 'typescript'});
    },
    alreadyRendered
);

fsExtra.outputFile(
    '/DATA/plugin_projects/oapi3codegen/mock/working-example.ts',
    prettier.format(summaryText, {parser: 'typescript'})
);

console.log(_.map(alreadyRendered, v => v.toString()).sort());