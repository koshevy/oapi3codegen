
// todo оптимизировать файлову структуру и типизацию
import { BaseConvertor } from "../../../core";
import { DataTypeDescriptor } from "../../../core/data-type-descriptor";
import { AbstractTypeScriptDescriptor } from "./abstract";

export class StringTypeScriptDescriptor extends AbstractTypeScriptDescriptor implements DataTypeDescriptor {

    constructor (

        schema: any,

        /**
         * Родительский конвертор, который используется
         * чтобы создавать вложенные дескрипторы.
         */
        convertor: BaseConvertor,

        /**
         * Рабочий контекст
         */
        public context: {[name: string]: DataTypeDescriptor},

        /**
         * Название этой модели (может быть string
         * или null).
         */
        public modelName: string,

        /**
         * Путь до оригинальной схемы, на основе
         * которой было создано описание этого типа данных.
         */
        public originalSchemaPath: string
    ) {
        super(
            schema,
            convertor,
            context,
            modelName,
            originalSchemaPath
        );
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
        return `${rootLevel ? `${comment}type ${this.modelName} = ` : ''}string`;
    }
}
