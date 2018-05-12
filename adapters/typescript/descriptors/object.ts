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
         * Родительские модели.
         */
        public readonly ancestors?: ObjectTypeScriptDescriptor[]

    ) {
        super(
            schema,
            convertor,
            context,
            modelName,
            suggestedModelName,
            originalSchemaPath
        );

        // обработка свойств предков
        if(this.ancestors) {
            _.each(this.ancestors, ancestor => {
                _.assign(
                    this.propertiesSets[0],
                    ancestor['propertiesSets'][0] || {}
                )
            });
        }

        // Обработка собственных свойств
        if (schema.properties) {
            _.each(schema.properties, (propSchema, propName) => {

                const suggestedName = (modelName || suggestedModelName || '')
                    + _.camelCase(propName).replace(
                        /^./, propName[0].toUpperCase()
                    );

                const typeContainer = convertor.convert(
                    propSchema,
                    context,
                    null,
                    suggestedName
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
        }

        // если по итогам, свойств нет, указывается
        // универсальное описание
        if(!_.keys(this.propertiesSets[0] || {}).length) {
            this.propertiesSets[0]['[key: string]'] = {
                required: true,
                comment: '',
                // если нет свойств, получает тип Any
                typeContainer: convertor.convert(
                    <any>{},
                    <any>{}
                )
            }
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

        if(rootLevel && !this.modelName) {
            throw new Error(
                'Root object models should have model name!'
            );
        } else if(!rootLevel && this.modelName) {
            childrenDependencies.push(this);
            // если это не rootLevel, и есть имя,
            // то просто выводится имя
            return this.modelName;
        }

        const comment = this.getComments();
        const prefix = (rootLevel)
            ? (this.propertiesSets.length > 1
                ? `${comment}export type ${this.modelName} = `
                : `${comment}export interface ${this.modelName} ${this._renderExtends()}`)
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
                            type => type.render(childrenDependencies, false)
                        ).join('; ')
                    }`;
                }
            )).join('; ')} }`
        ).join(' | ');

        return [prefix, properties].join('');
    }

    /**
     * Превращение "ancestors" в строку.
     * @returns {string}
     * @private
     */
    private _renderExtends(): string {
        let filteredAncestors = []
        if (this.ancestors && this.ancestors.length) {
            filteredAncestors = _.filter(
                this.ancestors,
                ancestor => ancestor.name ? true : false
            );
        }

        return filteredAncestors.length
            ? ''
            : ` extends ${filteredAncestors.join(', ')} `;
    }
}
