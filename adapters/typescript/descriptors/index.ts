import { NumberTypeScriptDescriptor } from "./number";
import { ObjectTypeScriptDescriptor } from "./object";
import { AnyTypeScriptDescriptor } from "./any";

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