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
     * Описание типа данных для элементов массива.
     * fixme не поддерживает конкретное перечисление (items: [...]), пока только общее (items: {...})
     */
    protected itemsDescription: DataTypeContainer;

    constructor (

        public schema: any,

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

        /*
         * Предлагаемое имя для типа данных: может
         * применяться, если тип данных анонимный, но
         * необходимо вынести его за пределы родительской
         * модели по-ситуации (например, в случае с Enum).
         */
        public readonly suggestedModelName: string,

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
            suggestedModelName,
            originalSchemaPath
        );

        // fixme не поддерживает конкретное перечисление (items: [...]), пока только общее (items: {...})
        if (schema.items) {
            this.itemsDescription = convertor.convert(
                schema.items,
                context,
                null,
                (modelName || suggestedModelName)
                    ? `${(modelName || suggestedModelName)}Items`
                    : null
            );
        }
    }

    /**
     * Рендер типа данных в строку.
     *
     * @param {DataTypeDescriptor[]} childrenDependencies
     * Immutable-массив, в который складываются все зависимости
     * типов-потомков (если такие есть).
     * @param {boolean} rootLevel
     * Говорит о том, что это рендер "корневого"
     * уровня — то есть, не в составе другого типа,
     * а самостоятельно.
     *
     * @returns {string}
     */
    public render(
        childrenDependencies: DataTypeDescriptor[],
        rootLevel: boolean = true
    ): string {
        const comment = this.getComments();
        return `${rootLevel ? `${comment}export type ${this.modelName} = ` : ''}${
            this.itemsDescription ? _.map(
                this.itemsDescription,
                (descr: DataTypeDescriptor) => {
                    return `Array<${descr.render(childrenDependencies,false)}>`;
                }
            ).join(' | ') : 'any[]'
        }`;
    }
}
