import * as _ from 'lodash';

// todo оптимизировать файлову структуру и типизацию
import {
    DataTypeDescriptor,
    DataTypeContainer
} from "../../../core/data-type-descriptor";
import { BaseConvertor } from "../../../core";
import { AbstractTypeScriptDescriptor } from "./abstract";


export class ArrayTypeScriptDescriptor extends AbstractTypeScriptDescriptor implements DataTypeDescriptor {

    /**
     * Описание дипа данных для
     */
    protected itemsDescription: DataTypeContainer;

    constructor (

        protected schema: any,

        /**
         * Родительский конвертор, который используется
         * чтобы создавать вложенные дескрипторы.
         */
        protected convertor: BaseConvertor,

        /**
         * Рабочий контекст
         */
        public readonly context: {[name: string]: DataTypeDescriptor},

        /**
         * Название этой модели (может быть string
         * или null).
         */
        public readonly modelName: string,

        /**
         * Путь до оригинальной схемы, на основе
         * которой было создано описание этого типа данных.
         */
        public readonly originalSchemaPath: string

    ) {
        super(
            schema,
            convertor,
            context,
            modelName,
            originalSchemaPath
        );

        if (schema.items) {
            this.itemsDescription = convertor.convert(
                schema.items,
                context
            );
        }
    }

    /**
     * Рендер типа данных в строку.
     * @param {boolean} rootLevel
     * Говорит о том, что это рендер "корневого"
     * уровня — то есть, не в составе другого типа,
     * а самостоятельно.
     *
     * @returns {string}
     */
    public render(rootLevel: boolean = true): string {

        const comment = this.getComments();
        return `${rootLevel ? `${comment}type ${this.modelName} = ` : ''}${
            this.itemsDescription
                ? _.map(
                    this.itemsDescription,
                    (descr: DataTypeDescriptor) => {
                        return `Array<${descr.render(false)}>`;
                    }
                ).join(' | ') : 'any[]'
        }`;
    }
}
