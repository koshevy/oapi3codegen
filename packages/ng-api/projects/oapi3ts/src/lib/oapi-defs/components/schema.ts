import { ObjectWithRef } from '../common';
import { DataType } from './schema-data-type';

export interface Schema extends ObjectWithRef {
    description?: string;
    required?: string[];
    title?: string;
    type: DataType | any;
    $ref?: string;
    example?: any;
    default?: any;

    /**
     * Custom property means the property of this
     * schema is read only.
     */
    readOnly?: boolean;

    [key: string]: any;
}
