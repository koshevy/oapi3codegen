import * as _ from 'lodash';
import * as fsExtra from 'fs-extra';
import * as Ajv from 'ajv';

import {
    OApiStructure,
    Schema
} from "../../oapi-defs";
import { BaseConvertor } from "../../core";

import {
    DataTypeContainer,
    DataTypeDescriptor
} from '../../core';

import { Parameter } from '../../oapi-defs';

// правила для определения дипа дескриптора
import { rules } from "./descriptors";

type DescriptorContext = {[name: string]: DataTypeDescriptor}

/**
 * Класс загрузчика для TypeScript.
 */
export class Convertor extends BaseConvertor {

    /**
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

    constructor() {
        super();
        this._ajv = new Ajv();
    }

    public convert(
        schema: Schema,
        context: DescriptorContext,
        name?: string,
        originalPathSchema?: string
    ): DataTypeContainer {

        let variantsOf;

        // получение по $ref
        if (schema['$ref']) {
            const refSchema = this._findTypeByPath(
                schema['$ref'],
                context
            );

            // если вся схема состоит только из "$ref",
            // то просто возвращается найденный дескриптор
            if(_.values(schema).length === 1) {
                return refSchema;
            } else {
                // fixme: отследить, будет ли испоьзоваться этот сценарий
                // fixme: здесьнужен эффективный механизм смешения уже готовой схемы с надстройкой
                // fixme: пока просто валит ошибку
                throw new Error(
                    `Error (fix this place?): you should't get '$ref' and other properties as neighbors.`
                );
            }
        } else if(
            variantsOf = this._processAllOf(schema, context)
                      || this._processAnyOf(schema, context)
                      || this._processOneOf(schema, context)
        )
            return variantsOf;

        // основной сценарий
        else {
            const constructor = this._findMatchedConstructor(schema);

            return constructor
                ? [new constructor(
                    schema,
                    this,
                    context,
                    name,
                    originalPathSchema
                )]
                : null;
        }
    }

    /**
     * Обработка allOf в схеме.
     *
     * @param {Schema} schema
     * @param {DescriptorContext} context
     * @returns {DataTypeContainer}
     * @private
     */
    protected _processAllOf(
        schema: Schema,
        context: DescriptorContext,
    ): DataTypeContainer | false {
        // todo сделать обработку allOf
        return null;
    }

    protected _processAnyOf(
        schema: Schema,
        context: DescriptorContext,
    ): DataTypeContainer | false {
        return null;
    }

    protected _processOneOf(
        schema: Schema,
        context: DescriptorContext,
    ): DataTypeContainer | false {
        return null;
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
}
