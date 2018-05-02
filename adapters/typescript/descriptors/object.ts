import * as _ from 'lodash';

// todo оптимизировать файлову структуру и типизацию
import {
    DataTypeDescriptor,
    DataTypeContainer
} from "../../../core/data-type-descriptor";
import { BaseConvertor } from "../../../core";
import { AbstractTypeScriptDescriptor } from "./abstract";

interface PropertyDescriptor {
    required: boolean;
    typeContainer: DataTypeContainer,
    comment: string
}

export class ObjectTypeScriptDescriptor extends AbstractTypeScriptDescriptor implements DataTypeDescriptor {

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
            modelName,
            originalSchemaPath
        );

        // смешение разных вариантов
        if(schema.allOf) {
            // todo: сделать обработку allOf
            // смешение всех вариантов
            // ...
        } else if(schema.anyOf) {
            // todo: сделать обработку anyOf
            // выбор нескольких возможных
            // ...
        } else if(schema.oneOf) {
            // todo: сделать обработку anyOf
            // выбор только одного
            // ...
        }

        // Обработка свойства.
        // todo: сейчас обрабатывается только один набор свойств — без вариантов
        if (schema.properties) {
            _.each(schema.properties, (propSchema, propName) => {

                const typeContainer = convertor.convert(
                    propSchema,
                    context
                );

                const propDescr = {
                    required: _.findIndex(
                        schema.required || [],
                        v => v === propName
                    ) !== -1,

                    typeContainer,

                    comment: typeContainer[0]
                        ? typeContainer[0].getComments()
                        : ''
                };

                this.propertiesSets[0][propName] = propDescr;
            });
        } else this.propertiesSets[0]['[key: string]'] = {
            required: true,
            comment: '',
            // получает тип Any
            typeContainer: convertor.convert(
                <any>{},
                <any>{}
            )
        }
    }

    private _allOf(variants) {

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

        if(rootLevel && !this.modelName) {
            throw new Error(
                'Root object models should have model name!'
            );
        } else if(!rootLevel && this.modelName) {
            // если это не rootLevel, и есть имя,
            // то просто выводится имя
            return this.modelName;
        }

        const comment = this.getComments();
        const prefix = (rootLevel)
            ? (this.propertiesSets.length > 1
                ? `${comment}export type ${this.modelName} = `
                : `${comment}export interface ${this.modelName} `)
            : '';


        // рекурсивно просчитывает вложенные свойства
        const properties = _.map(
            this.propertiesSets,
            (propertySet) => `{ ${_.values(_.map(
                propertySet,
                (descr: PropertyDescriptor, name) => {
                    const propName = name.match(/\-/) ? `'${name}'` : name;
                    return `\n\n${descr.comment}${propName}${!descr.required ? '?' : ''}: ${
                        _.map(
                            descr.typeContainer,
                            type => type.render(false)
                        ).join('; ')
                    }`;
                }
            )).join('; ')} }`
        ).join(' | ');

        return [prefix, properties].join('');
    }
}
