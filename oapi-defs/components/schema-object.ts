import { Schema } from './schema';

export interface SchemaObject extends Schema {
    description?: string;
    required?: string[];
    title?: string;
    type: 'object';
    $ref?: string;
    example?: {[key: string]: any};
    default?: {[key: string]: any};

    additionalProperties?: Schema;
    properties?: {[key: string]: Schema};
}
