import { SchemaObject } from "../../../oapi-defs/components";

import { AbstractTypeScriptDescriptor } from "./abstract";
import { AnyTypeScriptDescriptor } from "./any";
import { ArrayTypeScriptDescriptor } from "./array";
import { BooleanTypeScriptDescriptor } from "./boolean";
import { EnumTypeScriptDescriptor } from "./enum";
import { Instanceof } from "./instanceof";
import { NullTypeScriptDescriptor } from "./null";
import { NumberTypeScriptDescriptor } from "./number";
import { ObjectTypeScriptDescriptor } from "./object";
import { SomeOfTypeScriptDescriptor } from "./some-of";
import { StringTypeScriptDescriptor } from "./string";

export interface DescriptorRule {
    rule: SchemaObject;
    classConstructor: typeof AbstractTypeScriptDescriptor;
}

/**
 * Правила для определения: какой тип данных будет использоваться.
 *
 * - rule — это описание условий для JSON Schema-объекта в формате JSON Schema
 * - classConstructor — конструктор для класса, наследующего интерфейс `DataTypeDescriptor`
 *
 * @type {Array}
 */
export const rules: DescriptorRule[] = [
    {
        rule: {
            type: 'object',
            required: ['oneOf'],
            properties: {
                oneOf: {
                    type: 'array',
                    items: {
                        type: 'object'
                    }
                }
            },
            additionalProperties: true
        },
        classConstructor: SomeOfTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['anyOf'],
            properties: {
                anyOf: {
                    type: 'array',
                    items: {
                        type: 'object'
                    }
                }
            },
            additionalProperties: true
        },
        classConstructor: SomeOfTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['allOf'],
            properties: {
                allOf: {
                    type: 'array',
                    items: {
                        type: 'object'
                    }
                }
            },
            additionalProperties: true
        },
        classConstructor: SomeOfTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['enum'],
            properties: {
                enum: {
                    type: 'array',
                    items: {
                        oneOf: [
                            {type: 'string'},
                            {type: 'number'},
                            {type: 'integer'}
                        ]
                    }
                }
            },
            additionalProperties: true
        },
        classConstructor: EnumTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['type'],
            properties: {
                type: {
                    type: 'string',
                    pattern: '(integer|number)'
                }
            },
            additionalProperties: true
        },
        classConstructor: NumberTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['type'],
            properties: {
                type: {
                    type: 'string',
                    pattern: 'string'
                }
            },
            additionalProperties: true
        },
        classConstructor: StringTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['type'],
            properties: {
                type: {
                    type: 'string',
                    pattern: 'object'
                }
            },
            additionalProperties: true
        },
        classConstructor: ObjectTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['type'],
            properties: {
                type: {
                    type: 'string',
                    pattern: 'array'
                }
            },
            additionalProperties: true
        },
        classConstructor: ArrayTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['type'],
            properties: {
                type: {
                    type: 'string',
                    pattern: 'boolean'
                }
            },
            additionalProperties: true
        },
        classConstructor: BooleanTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['type'],
            properties: {
                type: {
                    type: 'string',
                    pattern: 'null'
                }
            },
            additionalProperties: true
        },
        classConstructor: NullTypeScriptDescriptor
    },
    {
        rule: {
            type: 'object',
            required: ['instanceof'],
            properties: {
                'instanceof': {
                    type: 'string'
                }
            },
            additionalProperties: true
        },
        classConstructor: Instanceof
    },
    // тип по-умолчанию
    {
        rule: {
            type: 'object',
            additionalProperties: true
        },
        classConstructor: AnyTypeScriptDescriptor
    }
];
