import * as _ from 'lodash';

// todo оптимизировать файлову структуру и типизацию
import {
    DataTypeDescriptor,
    DataTypeContainer
} from "../../../core/data-type-descriptor";
import { BaseConvertor } from "../../../core";

interface PropertyDescriptor {
    required: boolean;
    typeContainer: DataTypeContainer
}

export abstract class AbstractTypeScriptDescriptor implements DataTypeDescriptor {

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

    ) { }

    /**
     * Получение комментариев для этого дескриптора.
     * @returns {string}
     * @private
     */
    public getComments(): string {
        let commentLines =  [],
            comment = '';

        if(this.schema.description) {
            commentLines = this.schema.description.trim()
                .split('\n');
        }
        if(this.schema.title)
            commentLines.unshift(`# ${this.schema.title}`, '');

        if(commentLines.length) {
            comment = `/**\n${_.map(
                commentLines,
                v => ` * ${v}`
            ).join('\n')}\n */\n`;
        }

        return comment;
    }

    public toString(): string {
        return `${this.modelName || 'Anonymous Type'}${
            this.originalSchemaPath
                ? `(${this.originalSchemaPath})`
                : ''
        }`;
    }

    /**
     * Рендер типа данных в строку.
     *
     * @param {RenderResult[]} childrenDependencies
     * Immutable-массив, в который складываются все зависимости
     * типов-потомков (если такие есть).
     * @param {boolean} rootLevel
     * Говорит о том, что это рендер "корневого"
     * уровня — то есть, не в составе другого типа,
     * а самостоятельно.
     *
     * @returns {string}
     */
    public abstract render(
        childrenDependencies: DataTypeDescriptor[],
        rootLevel: boolean
    ): string ;
}
