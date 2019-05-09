import { BaseConvertor } from '../convertor';
import { Schema } from '../../oapi-defs';

import {
    DataTypeContainer,
    DataTypeDescriptor,
    DescriptorContext
} from '../index';

/**
 * Mock convertor for tests
 */
export class MockConvertor extends BaseConvertor {

    public convert(
        schema: Schema,
        context: DescriptorContext,
        name?: string,
        suggestedName?: string,
        originalPathSchema?: string,
        ancestors?: DataTypeDescriptor[]
    ): DataTypeContainer {

        return null;
    }
}
