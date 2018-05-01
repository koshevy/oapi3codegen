import * as path from 'path';
import { Convertor } from './adapters/typescript';

const convertor: Convertor = new Convertor();
convertor.loadStructureFromFile(path.resolve(
    './mock/sample-schema.json'
));

convertor.start();