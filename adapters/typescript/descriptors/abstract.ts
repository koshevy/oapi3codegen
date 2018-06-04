import * as _ from 'lodash';
import * as prettier from 'prettier';

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
        public readonly originalSchemaPath: string,

        /**
         * Родительсткие модели.
         */
        public readonly ancestors?: DataTypeDescriptor[]

    ) { }

    /**
     * Получение комментариев для этого дескриптора.
     * @returns {string}
     * @private
     */
    public getComments(): string {
        const description = prettier.format(
            `${
                this.schema.title
                    ? `## ${this.schema.title}\n`
                    : ''
            }${ (this.schema.description || '').trim()}`,
            {
                parser: 'remark',
                proseWrap: 'always'
            }
        );

        let commentLines = _.compact(description.split('\n')),
            comment = '';

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
    public abstract render(
        childrenDependencies: DataTypeDescriptor[],
        rootLevel: boolean
    ): string ;
}
