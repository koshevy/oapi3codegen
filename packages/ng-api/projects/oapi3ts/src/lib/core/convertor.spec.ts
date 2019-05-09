import { MockConvertor } from './mocks/mock-convertor';
import { defaultConfig } from './config';

describe('BaseConvertor methods tests', () => {
    const convertor = new MockConvertor(defaultConfig);
    console.log(convertor);
});
