import * as fsExtra from 'fs-extra';
import * as _ from 'lodash';
import { OApiStructure } from '../oapi-defs';
import {
    DataTypeContainer,
    DataTypeDescriptor
} from '../core';
import * as prettier from 'prettier';

import {
    Schema,
    Parameter,
    Response
} from '../oapi-defs';

type DescriptorContext = {[name: string]: DataTypeDescriptor}

/**
 * ContentType ответов по-умолчанию.
 * todo вынести в конфиг. если конфига нет — учредить
 * @type {string}
 */
const defaultContentType = 'application/json';

/**
 * Регулярное выражение для JSON Path-путей.
 * todo вынести в конфиг. если конфига нет — учредить
 * @type {RegExp}
 */
const pathRegex = /([\w:\/\\\.]+)?#(\/?[\w+\/?]+)/;

/**
 * Базовый класс загрузчика.
 */
export abstract class BaseConvertor {

    protected _structure: OApiStructure;

    public loadStructure(structure: OApiStructure) {
        this._structure = structure;
    }

    public loadStructureFromFile(fileName): boolean {
        this._structure = <OApiStructure>fsExtra.readJsonSync(fileName);
        return this._structure ? true : false;
    }

    /**
     * Получение входных точек для 'вытаскивания' типов данных.
     * @returns {DataTypeContainer}
     */
    public start(): void {
        let result: DataTypeContainer[] = [];

        let context = {};

        //параметры
        const methodsSchemes = this._getMethodsSchemes();

        const dataTypeContainers = _.map(
            methodsSchemes,
            (schema, modelName) => this.convert(
                schema,
                context,
                modelName
            )
        );

        _.each(dataTypeContainers, arr => {
            _.each(arr, descriptor => {
                if(descriptor)
                    console.log(prettier.format(descriptor.render()));
            });
        });
    }

    public abstract convert(
        schema: Schema,
        context: Object,
        name?: string,
        originalPathSchema?: string
    ): DataTypeContainer;

    // *** Закрытые методы

    /**
     * Извлечени схем из параметров, ответов и тел запросов для API.
     * @returns {{[p: string]: Schema}}
     * @private
     */
    private _getMethodsSchemes(): {[className: string]: Schema} {

        let result = {};

        // Текущая OpenAPI-структура
        const struct = this._structure;

        // Создание схем для API-методов
        for (let pathName in struct.paths) {
            const methods = struct.paths[pathName];
            for (let methodName in methods) {
                // описание метода
                const method = methods[methodName];
                // название модели по-умолчанию
                const baseTypeName = [
                    _.capitalize(methodName),
                    _.upperFirst(_.camelCase(pathName))
                ].join('');

                const sch = {
                   type: "object",
                   required: [],
                   properties: {}
                };

                // обработка параметров
                _.each(method.parameters || {}, (parameter: Parameter) => {
                    if (parameter.schema) {
                        const modelName = `${baseTypeName}Parameters`;

                        sch.properties[parameter.name] = parameter.schema;
                        if (parameter.required) {
                            sch.required.push(parameter.name);
                        }

                        result[modelName] = sch;
                    }
                });

                // обработка ответов
                _.each(method.responses || {}, (
                    response: Response,
                    code: number
                ) => {
                    // todo пока обрабатывается только контент
                    _.each(response.content || {}, (
                        content: any,
                        contentType: string
                    ) => {
                        const ctSuffix = (contentType === defaultContentType)
                            ? '' : `_${_.camelCase(contentType)}`;

                        // todo вынести в конфиг правилос формирования имени
                        const modelName = `${baseTypeName}${ctSuffix}_response${code}`;

                        if(content.schema)
                            result[modelName] = content.schema;
                    })
                });

                // оброботка тела запроса
                // todo пока обрабатывается только ContentType по-умолчанию
                const requestBody = _.get(
                    method,
                    `requestBody.content.${defaultContentType}.schema`
                );

                if (requestBody) {
                    result[`${baseTypeName}Request`] = requestBody;
                }
            }
        }

        return result;
    }

    /**
     * Получить дескриптор типа по JSON Path:
     * возвращает уже созданный ранее, или создает
     * новый при первом упоминании.
     *
     * @param {string} path
     * @param {DescriptorContext} context
     * @returns {DataTypeDescriptor}
     * @private
     */
    protected _findTypeByPath(
        path: string,
        context: DescriptorContext
    ): DataTypeContainer {
        return _.find(
            _.values(context),
            (v: DataTypeDescriptor) =>
                v.originalSchemaPath === path
            )
            || this._processSchema(path, context);
    }

    /**
     * Получение нового дескриптора на основе JSON Path
     * из текущей структуры.
     *
     * @param {string} path
     * @param {DescriptorContext} context
     * @returns {DataTypeDescriptor}
     * @private
     */
    protected _processSchema(
        path: string,
        context: DescriptorContext
    ): DataTypeContainer {

        const schema = this._getSchemaByPath(path);
        const modelName = (_.trim(path,'/\\').match(/(\w+)$/) || [])[1];

        if (!schema) throw new Error(
            `Error: can't find schema with path: ${path}!`
        );

        return this.convert(schema, context, modelName, path);
    }

    protected _getSchemaByPath(path: string): Schema {
        const pathMatches = path.match(pathRegex);

        if (pathMatches) {
            const filePath = pathMatches[1];
            const schemaPath = pathMatches[2];
            const src = filePath
                ? this._getForeignSchema(filePath)
                : this._structure;

            const result = _.get(
                src,
                _.trim(schemaPath, '#/\\')
                    .replace(/[\\\/]/g, '.')
            );

            return result;

        } else throw new Error(
            'JSON Path error:  ' +
            `${path} is not valid JSON path!`
        );
    }

    /**
     * Получение сторонней схемы.
     * @param {string} resourcePath
     * URL или путь до файла, содержащего стороннюю схему.
     * @returns {Schema}
     * @private
     */
    protected _getForeignSchema(resourcePath: string): Schema {
        // todo обращение к внешним файлам еще не реализовано
        throw new Error(
            `TODO: have to implement appeal to foreign files/urls. Path: ${resourcePath}.`
        );
    }
}
