import * as _ from 'lodash';
import * as fsExtra from 'fs-extra';
import * as Ajv from 'ajv';

import {
    OApiStructure,
    Schema
} from "../../oapi-defs";
import {
    BaseConvertor,
    ConvertorConfig,
    defaultConfig
} from "../../core";

import {
    DataTypeContainer,
    DataTypeDescriptor,
    DescriptorContext
} from '../../core';

// rules that helps determine a type of descriptor
import { rules } from "./descriptors";

/**
 * Record in temporary list of schemas in process.
 * Those records are creating in order to avoid infinity loop
 * for recursive types.
 */
interface SchemaHold {
    schema: Schema;
    bulk: Object;
}

/**
 * Class of converter from OAPI3 to TypeScript types.
 */
export class Convertor extends BaseConvertor {

    /**
     * Рекурсивный рендеринг
     * [контенейра дескрипторов типов]{@link DataTypeContainer}
     * с ренлерингом всех их зависиомостей.
     *
     * @param {DataTypeContainer} typeContainer
     * Типы, которые нужно отрендерить.
     * @param {(descriptor: DataTypeDescriptor, text) => void} renderedCallback
     * Колбэк, который срабатывает при рендеринге типа.
     * @param {DataTypeContainer} alreadyRendered
     * Типы, которые уже отрендерены, и их рендерить не нужно
     * @param {boolean} rootLevel
     * `false`, если это дочерний "процес"
     * @returns {string[]}
     */
    public static renderRecursive(
        typeContainer: DataTypeContainer,
        renderedCallback: (descriptor: DataTypeDescriptor, text) => void,
        alreadyRendered: DataTypeContainer = []
    ): void {
        let result = [];

        _.each(typeContainer, (descr: DataTypeDescriptor) => {

            let childrenDependencies = [];

            // если этот тип еще не рендерился
            if(_.findIndex(
                alreadyRendered,
                v => v.toString() === descr.toString()
            ) !== -1) {
                return;
            } else {
                // помечает, что на следующем этапе не нужно
                // обрабатывать уже обработанные типы
                alreadyRendered.push(descr);
            }

            /**
             * Рендеринг очередного типа из очереди
             * @type {string}
             */
            const renderResult = descr.render(
                childrenDependencies,
                true
            );

            // далее, рекурсивно нужно просчитать зависимости
            this.renderRecursive(
                // только те, которые еще не были просчитаны
                _.filter(
                    childrenDependencies,
                    (ov) => {
                        return _.findIndex(
                            alreadyRendered,
                            iv => ov.toString() === iv.toString()
                        ) === -1
                    }
                ),
                renderedCallback,
                alreadyRendered
            );

            // Колбэк вызывается в конце, чтобы типы-зависимости
            // шли впереди использующих их.
            renderedCallback(descr, renderResult);
        });
    }

    protected _ajv;
    protected _onHoldSchemas: SchemaHold[] = [];

    constructor(
        /**
         * Конфигурация для конвертора.
         * @type {ConvertorConfig}
         */
        protected config: ConvertorConfig = defaultConfig
    ) {
        super(config);
        this._ajv = new Ajv();
    }

    /**
     * Превращение JSON-схемы в описание типа данных.
     * Возвращает контейнер [дескрипторов типов]{@link DataTypeDescriptor},
     * в котором перечисляются типы данных (возможна принадлежность
     * к более чем одному типу данных: `number[] | InterfaceName`).
     *
     * @param {Schema} schema
     * Схема, для которой будет подобрано соответствущее
     * правило, по которому будет определен дескриптор
     * нового типа данных.
     * @param {Object} context
     * Контекст, в котором хранятся ранее просчитаные модели
     * в рамках одной цепочки обработки.
     * @param {string} name
     * Собственное имя типа данных
     * @param {string} suggestedName
     * Предлагаемое имя для типа данных: может
     * применяться, если тип данных анонимный, но
     * необходимо вынести его за пределы родительской
     * модели по-ситуации (например, в случае с Enum).
     * @param {string} originalPathSchema
     * Путь, по которому была взята схема
     * @param {DataTypeDescriptor[]} ancestors
     * Родительсткие модели
     *
     * @returns {DataTypeContainer}
     */
    public convert(
        schema: Schema,
        context: DescriptorContext,
        name?: string,
        suggestedName?: string,
        originalPathSchema?: string,
        ancestors?: DataTypeDescriptor[]
    ): DataTypeContainer {

        // holding schema on in order to avoid infinity loop
        const holdSchema = this._holdSchemaBeforeConvert(schema);
        if (holdSchema) return <any>holdSchema.bulk;

        let result;

        // получение по $ref
        if (schema['$ref']) {

            // исключаются элементы, которые не оказывают
            // влияния на определение типа (title, nullable и т.д.)
            const valuableOptionsCount = _.values(
                _.omit(schema, [
                    // fixme move to config. copypasted in descriptors/object.ts
                    'description',
                    'title',
                    'example',
                    'default',
                    'readonly',
                    'nullable'
                ]),
            ).length;

            if(valuableOptionsCount === 1) {
                result = (name && !this.config.implicitTypesRefReplacement)
                    // если неанонимный, то создает новый на основе предка
                    ? this.convert(
                        this.getSchemaByPath(schema['$ref']),
                        context,
                        name,
                        suggestedName,
                        originalPathSchema,
                        this.findTypeByPath(schema['$ref'], context)
                    )
                    // если это анонимный тип, он просто ссылается
                    // на другой существующий
                    : this.findTypeByPath(schema['$ref'], context);
            } else {
                const refSchema = this.getSchemaByPath(schema['$ref']);

                if(!refSchema) {
                    throw new Error(`$ref is not found: ${schema['$ref']}`);
                }

                result = this.convert(
                    _.merge(refSchema, _.omit(schema, ['$ref'])),
                    context,
                    name,
                    suggestedName,
                    originalPathSchema,
                    this.findTypeByPath(schema['$ref'], context)
                );
            }
        }

        // основной сценарий
        else {
            const constructor = this._findMatchedConstructor(schema);

            result = constructor
                ? [new constructor(
                    schema,
                    this,
                    context,
                    name,
                    suggestedName,
                    originalPathSchema,
                    ancestors
                )]
                : null;
        }

        this._holdSchemaOf(schema, result)

        return result;
    }

    /**
     * Поиск конструктора для дескриптора типа данных,
     * условиям которого, удовлетворяет данная схема.
     *
     * @param {Schema} schema
     * @returns {any}
     * @private
     */
    protected _findMatchedConstructor(schema: Schema): any {
        return (_.find(rules, (item) => {
            if (!item._schemaComplied)
                item._schemaComplied = this._ajv.compile(item.rule);
            return item._schemaComplied(schema);
        }) || {}).classConstructor;
    }

    protected _holdSchemaBeforeConvert(schema: Schema): SchemaHold | null {
        const alreadyOn = _.find(this._onHoldSchemas, (v: SchemaHold) =>
            v.schema === schema
        );

        if (!alreadyOn) {
            this._onHoldSchemas.push({
                schema,
                bulk: {}
            });
        }

        return alreadyOn;
    }

    protected _holdSchemaOf(schema: Schema, descr: DataTypeDescriptor): void {
        const index = _.findIndex(this._onHoldSchemas, (v: SchemaHold) =>
            v.schema === schema
        );

        if (index !== -1) {
            const record = this._onHoldSchemas[index];

            if (descr) {
                _.assign(
                    this._onHoldSchemas[index].bulk,
                    descr
                );
            }

            this._onHoldSchemas.splice(index, 1);
        }
    }
}
