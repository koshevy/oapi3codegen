import * as path from 'path';
import * as _ from 'lodash';
import * as prettier from 'prettier';

import { Convertor } from './adapters/typescript';

const convertor: Convertor = new Convertor();
convertor.loadStructureFromFile(path.resolve(
    './mock/sample-schema-1.json'
));

let context = {};
let entryPoints = convertor.getEntryPoints(context);

_.each(entryPoints, descriptor => {
    console.log(prettier.format(descriptor.render()));
});

// console.log(prettier.format(descriptor.render()));