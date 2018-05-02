import { NumberTypeScriptDescriptor } from "./number";
import { StringTypeScriptDescriptor } from "./string";
import { ObjectTypeScriptDescriptor } from "./object";
import { AnyTypeScriptDescriptor } from "./any";
import { EnumTypeScriptDescriptor } from "./enum";

/**
 * Правила для определения: какой тип данных будет использоваться.
 *
 * - rule — это описание условий для JSON Schema-объекта в формате JSON Schema
 * - classConstructor — конструктор для класса, наследующего интерфейс `DataTypeDescriptor`
 *
 * @type {Array}
 */
export const rules = [
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
    // тип по-умолчанию
    {
        rule: {
            type: 'object',
            additionalProperties: true
        },
        classConstructor: AnyTypeScriptDescriptor
    }
];