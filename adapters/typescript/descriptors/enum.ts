import * as _ from 'lodash';

// todo оптимизировать файлову структуру и типизацию
import { DataTypeDescriptor } from "../../../core/data-type-descriptor";
import { BaseConvertor } from "../../../core";
import { AbstractTypeScriptDescriptor } from "./abstract";


export class EnumTypeScriptDescriptor extends AbstractTypeScriptDescriptor implements DataTypeDescriptor {

    /**
     * Создение нового имени для `enum`, т.к. `enum` не может
     * быть анонимным.
     */
    public static getNewEnumName(): string {
        return `Enum_${this._enumNamesCount++}`
    }

    /**
     * Количество автосозданных имени типов.
     */
    protected static _enumNamesCount = 0;

    /**
     * Свойства, относящиеся к этому объекту
     * (интерфейсы и классы).
     * @type {{}}
     */
    protected propertiesSets: [{
        [name: string]: PropertyDescriptor
    }] = [ {} ];

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
            modelName || (modelName = EnumTypeScriptDescriptor.getNewEnumName()),
            originalSchemaPath
        );
    }

    /**
     * Рендер типа данных в строку.
     *
     * @param {boolean} rootLevel
     * Говорит о том, что это рендер "корневого"
     * уровня — то есть, не в составе другого типа,
     * а самостоятельно.
     *
     * @returns {string}
     */
    public render(rootLevel: boolean = true): string {

        if(!rootLevel) {
            console.log(this.render(true));
        }

        const comment = this.getComments();

        // fixme не учитываются anyOf, allOf, oneOf
        return rootLevel ? `${comment}export enum ${this.modelName} {${
                _.map(this.schema.enum, v => {
                    return (_.isNumber(v) || (_.isString(v) && v.match(/^\d+$/)))
                        ? JSON.stringify(v)
                        : `${this._enumItemName(v)} = ${JSON.stringify(v)}`;
                }).join(', ')
            }}` : this.modelName;
    }

    private _enumItemName(name: string): string {
        name = _.camelCase(name);
        name = name.replace(
            /^./,
            name[0].match(/\d/)
                ? `_${name[0]}`
                : name[0].toUpperCase()
        );

        return name;
    }
}
