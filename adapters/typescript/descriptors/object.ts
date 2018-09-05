import * as _ from 'lodash';

// todo оптимизировать файлову структуру и типизацию
import {
    DataTypeDescriptor,
    DataTypeContainer
} from "../../../core/data-type-descriptor";
import { BaseConvertor } from "../../../core";
import { AbstractTypeScriptDescriptor } from "./abstract";

// todo support default values!
export interface PropertyDescriptor {
    required: boolean;
    readOnly: boolean;
    typeContainer: DataTypeContainer;
    comment: string;
    defaultValue: undefined;
    exampleValue: undefined;
}

export class ObjectTypeScriptDescriptor extends AbstractTypeScriptDescriptor implements DataTypeDescriptor {

    /**
     * Свойства, относящиеся к этому объекту
     * (интерфейсы и классы).
     * @type {{}}
     */
    public propertiesSets: [{
        [name: string]: PropertyDescriptor
    }] = [ {} ];

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
            originalSchemaPath,
            ancestors
        );

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

                    readOnly: propSchema.readOnly,

                    typeContainer,

                    comment: typeContainer[0]
                        ? typeContainer[0].getComments()
                        : '',

                    defaultValue: propSchema.default,
                    exampleValue: this._findExampleInTypeContainer(typeContainer)
                };

                // last step: apply "nullable" property after schema is
                // interpreted to make life easier
                if (propSchema.nullable) {
                    this._makeSchemaNullable(
                        propSchema
                    );
                }

                this.propertiesSets[0][propName] = propDescr;
            });
        }

        // обработка свойств предков
        if(this.ancestors) {
            _.each(this.ancestors, ancestor => {
                _.assign(
                    this.propertiesSets[0],
                    ancestor['propertiesSets'][0] || {}
                )
            });
        }

        // fixme: do additionalProperties support when additionalProperties === true

        // если по итогам, свойств нет, указывается
        // универсальное описание
        else if(
            schema.additionalProperties ||
            ( !_.keys(this.propertiesSets[0] || {}).length
              && (schema.additionalProperties !== false))
        ) {
            const addProp = schema.additionalProperties;
            const typeContainer = ('object' === typeof addProp)
                ? convertor.convert(
                    // these properties not affect a schema
                    _.omit(addProp, [
                        // fixme move to config. copypasted in typescript/convertot.ts
                        'description',
                        'title',
                        'example',
                        'default',
                        'readonly',
                        'nullable'
                    ]),
                    context,
                    null,
                    `${modelName}Properties`
                )
                : convertor.convert(
                    <any>{},
                    <any>{}
                );

            this.propertiesSets[0]['[key: string]'] = {
                required: true,
                comment: typeContainer[0]
                    ? typeContainer[0].getComments()
                    : '',
                readOnly: ('object' === typeof addProp)
                    ? addProp.readOnly || false
                    : false,
                // если нет свойств, получает тип Any
                typeContainer: typeContainer,
                defaultValue: undefined,
                exampleValue: undefined
            }

            // last step: apply "nullable" property after schema is
            // interpreted to make life easier
            if (schema.additionalProperties && schema.additionalProperties.nullable) {
                this._makeSchemaNullable(
                    schema.additionalProperties
                );
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
                : `${comment}export interface ${this.modelName}${this._renderExtends(childrenDependencies)}`)
            : '';

        // рекурсивно просчитывает вложенные свойства
        const properties = _.map(
            this.propertiesSets,
            (propertySet) => `{ ${_.values(_.map(
                propertySet,
                (descr: PropertyDescriptor, name) => {
                    const propName = name.match(/\-/) ? `'${name}'` : name;
                    return `\n\n${descr.comment}${descr.readOnly?'readonly ':''}${propName}${!descr.required ? '?' : ''}: ${
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

    public getExampleValue(): {[key:string]: any} {
        return this.schema.example || _.mapValues(
            this.propertiesSets[0],
            (v: PropertyDescriptor) => v.exampleValue || v.defaultValue
        );
    }

    /**
     * Превращение "ancestors" в строку.
     * @returns {string}
     * @private
     */
    private _renderExtends(dependencies: DataTypeDescriptor[]): string {
        let filteredAncestors = [];

        if (this.ancestors && this.ancestors.length) {
            filteredAncestors = _.filter(
                this.ancestors,
                ancestor => ancestor.modelName ? true : false
            );
        }

        dependencies.push.apply(
            dependencies,
            filteredAncestors
        );

        return filteredAncestors.length
            ? ` extends ${_.map(filteredAncestors, v => v.modelName).join(', ')} `
            : '';
    }

    private _findExampleInTypeContainer(
        typeContainer: DataTypeContainer
    ): any {
        for (const descr of typeContainer) {
            if (descr instanceof ObjectTypeScriptDescriptor) {
                return descr.getExampleValue();
            } else {
                const exV = descr.schema.example || descr.schema.default;
                if (exV) return exV;
            }
        }

        return undefined;
    }

    // fixme has to delete
    private _makeSchemaNullable(schema: any): void {
        // base scenario: simple type

        /*
        Old code:

        if (schema.type) {
            if ( _.isArray(schema.type)
                 && !_.find(schema.type, v => v === 'null')) {
                schema.type.push('null')
            } else if ('string' === typeof schema.type) {
                schema.type = [schema.type, 'null'];
            }
        } else if ( schema.$ref && !schema.anyOf &&
            // next scenario: single $ref
            !schema.oneOf && !schema.allOf) {

            const ref = schema.$ref;
            delete schema.$ref;
            schema.anyOf = [{type: 'null'}, {$ref: ref}]
        } else {
            // last scenario: variants
            _.each(
                schema.oneOf || schema.anyOf || schema.allOf || [],
                (subSchema) => {
                    this._makeSchemaNullable(subSchema)
                }
            )
        }
        */

        // New code: now actually have to wrap schema

        // delete schema.nullable;
        //
        // const schemaCopy = _.cloneDeep(schema);
        // for(const propName of _.keys(schema)) {
        //     delete schema[propName];
        // }
        //
        // schema.anyOf = [
        //     {type: 'null'},
        //     schemaCopy
        // ];
    }
}
