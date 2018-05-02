import * as Components from '../oapi-defs/components';

export type DescriptorSchema = Components.SchemaArray
    | Components.SchemaBoolean
    | Components.SchemaInteger
    | Components.SchemaNumber
    | Components.SchemaObject
    | Components.SchemaString;

export type DataTypeContainer = DataTypeDescriptor[];

export interface DataTypeDescriptor {

    // fixme решить проблему, вызывает ошибку: provides no match for the signature 'new (schema: any, modelName: string, originalSchemaPath: string): any'.
    // new (
    //     schema: any,
    //     modelName: string,
    //     originalSchemaPath: string
    // );

    /**
     * Название этой модели (может быть string
     * или null).
     */
    modelName?: string;

    /**
     * Путь до оригинальной схемы, на основе
     * которой было создано описание этого типа данных.
     */
    originalSchemaPath?: string;

    /**
     * Рендер типа данных в строку.
     * @returns {string}
     */
    render(rootLevel: boolean): string;

    /**
     * Получение комментариев для этого дескриптора.
     * @returns {string}
     * @private
     */
    // fixme сделать все TS-дескрипторы наследниками abstract и раскомментировать
    getComments(): string;
}