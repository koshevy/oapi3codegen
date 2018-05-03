import * as _ from 'lodash';

// todo оптимизировать файлову структуру и типизацию
import {
    DataTypeDescriptor,
    DataTypeContainer
} from "../../../core/data-type-descriptor";
import { BaseConvertor } from "../../../core";
import { AbstractTypeScriptDescriptor } from "./abstract";

export class OneOfTypeScriptDescriptor extends AbstractTypeScriptDescriptor implements DataTypeDescriptor {

    /**
     * Описания вариантов, которые являются частью типа.
     * При рендеринге будут исключены те типы, которые
     * рендерятся в одинаковый результат.
     */
    protected variants: DataTypeContainer;

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

        if (!schema.oneOf) {
            throw new Error(
                'Error: descriptor, recognized as "oneOf" should have that property.'
            );
        }

        // обработка разных вариантов
        const commonPart = _.omit(schema, ['oneOf']);
        this.variants = _.flattenDeep(_.map(schema.oneOf, variant => {
            return convertor.convert(
                _.merge(commonPart, variant),
                context
            );
        }), 1);
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
            this.variants
                ? _.uniq(_.map(
                    this.variants,
                    (descr: DataTypeDescriptor)=>
                        descr.render(false)
                )).join(' | ')
                : 'any[]'
        }`;
    }
}
