import * as fsExtra from 'fs-extra';
import * as _ from 'lodash';
import * as prettier from 'prettier';
import { OApiStructure } from '../oapi-defs';
import {
    DataTypeContainer,
    DataTypeDescriptor,
    DescriptorContext,
    ApiMetaInfo
} from '../core';

import {
    ConvertorConfig,
    defaultConfig
} from './config';

import {
    Schema,
    Parameter,
    Response,
    ParameterIn
} from '../oapi-defs';

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

    protected _foreignSchemaFn: (resourcePath: string) => Schema;

    constructor (
        /**
         * Конфигурация для конвертора.
         * @type {ConvertorConfig}
         */
        protected config: ConvertorConfig = defaultConfig
    ) {}

    /**
     * Загрузка структуры OpenAPI3-документа в конвертор.
     * @param {OApiStructure} structure
     */
    public loadOAPI3Structure(structure: OApiStructure) {
        this._structure = structure;
    }

    /**
     * Загрузка структуры OpenAPI3-документа в конвертор из файла.
     * @param fileName
     * @returns {boolean}
     */
    public loadOAPI3StructureFromFile(fileName): boolean {
        this._structure = <OApiStructure>fsExtra.readJsonSync(fileName);
        return this._structure ? true : false;
    }

    /**
     * Метод для установки функции, с помощью которой происходит обращение
     * к сторонней схеме (которая находится в другом файле).
     * @param {(resourcePath: string) => Schema} fn
     */
    public setForeignSchemeFn(fn: (resourcePath: string) => Schema): void {
        this._foreignSchemaFn = fn;
    }

    /**
     * Получение "входных точек" OpenAPI3-структуры:
     *
     * - Модели параметров API-методов
     * - Модели тел запросов API-методов
     * - Модели ответов API-методов
     *
     * С этих входных точек может быть начата "раскрутка" цепочки
     * зависимостей для рендеринга с помощью метода
     * [Convertor.renderRecursive]{@link Convertor.renderRecursive}.
     *
     * @param {ApiMetaInfo} metaInfo
     * Place where meta-information accumulates during
     * API-info extracting.
     *
     * @returns {DataTypeContainer}
     */
    public getOAPI3EntryPoints(
        context = {},
        metaInfo: ApiMetaInfo[] = []
    ): DataTypeContainer {
        let alreadyConverted = [];

        //параметры
        const methodsSchemes = this._getMethodsSchemes(metaInfo);

        const dataTypeContainers = _.map(
            methodsSchemes,
            (schema, modelName) => {

                const container = this.convert(
                    schema,
                    context,
                    modelName
                );

                // Исключение дубликатов.
                // Дубликаты появляются, когда типы данные, которые
                // ссылаются ($ref) без изменения на другие, подменяются
                // моделями из `components`.
                return _.map(container, (descr: DataTypeDescriptor) => {
                    // исключение элементов, которые имеют общий
                    // originalSchemaPath у элементов, на которые они сослались
                    if(descr.originalSchemaPath) {

                        if(_.findIndex(
                            alreadyConverted,
                            v => v === descr.originalSchemaPath
                        ) !== -1) {
                            return null;
                        }

                        alreadyConverted.push(
                            descr.originalSchemaPath
                        );
                    }

                    return descr;
                });
            }
        );

        return _.compact(_.flattenDepth(dataTypeContainers));
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
    public findTypeByPath(
        path: string,
        context: DescriptorContext
    ): DataTypeContainer {

        const alreadyFound = _.find(
            _.values(context),
            (v: DataTypeDescriptor) =>
                v.originalSchemaPath === path
        );

        return alreadyFound
            ? [alreadyFound]
            : this._processSchema(path, context);
    }

    public getSchemaByPath(path: string): Schema {
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
    public abstract convert(
        schema: Schema,
        context: DescriptorContext,
        name?: string,
        suggestedName?: string,
        originalPathSchema?: string,
        ancestors?: DataTypeDescriptor[]
    ): DataTypeContainer;

    // *** Закрытые методы

    /**
     * Извлечени схем из параметров, ответов и тел запросов для API.
     * @param {ApiMetaInfo[]} metaInfo
     * Place for storing meta-info of API-method.
     * @returns {{[p: string]: Schema}}
     * @private
     */
    private _getMethodsSchemes(
        metaInfo: ApiMetaInfo[]
    ): {[className: string]: Schema} {

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
                const baseTypeName = _.upperFirst(method.operationId) || [
                    _.capitalize(methodName),
                    _.upperFirst(_.camelCase(pathName))
                ].join('');

                const metaInfoItem: ApiMetaInfo = {
                    baseTypeName: baseTypeName,
                    method: methodName.toUpperCase(),
                    path: pathName,
                    queryParams: [],
                    servers: _.map(struct.servers || [], v => v.url),
                    mockData: {},
                    // default noname
                    apiSchemaFile: 'domain-api-schema',
                    typingsDependencies: [],
                    typingsDirectory: 'typings',
                    responseModelName: null,
                    requestModelName: null,
                    paramsModelName: null,
                    responseSchema: null,
                    requestSchema: null,
                    paramsSchema: null
                };

                const paramsSchema = {
                   type: "object",
                   required: [],
                   properties: {}
                };

                const paramsModelName = this.config.parametersModelName(baseTypeName);

                // обработка параметров
                _.each(method.parameters || {}, (parameter: Parameter, index) => {
                    if (parameter.schema) {

                        paramsSchema.properties[parameter.name] = parameter.schema;
                        paramsSchema.properties[parameter.name]["readOnly"] = parameter.readOnly;
                        if (parameter.required) {
                            paramsSchema.required.push(parameter.name);
                        }

                        result[paramsModelName] = paramsSchema;

                        if (index === 0) {
                            metaInfoItem.typingsDependencies.push(paramsModelName);
                            metaInfoItem.paramsModelName = paramsModelName;
                            metaInfoItem.paramsSchema = paramsSchema;
                        }

                        if (parameter.in === ParameterIn.Query) {
                            metaInfoItem.queryParams.push(parameter.name);
                        }

                        // fixme Need to test this place
                        // if(parameter.description)
                        //    result[paramsModelName].description = parameter.description;

                        if (!result[paramsModelName].description) {
                            result[paramsModelName].description = `Model of parameters for API ${pathName}`;
                        }
                    }
                });

                // обработка ответов
                _.each(method.responses || {}, (
                    response: Response,
                    code: number
                ) => {

                    if (response.$ref) {
                        response = _.merge(
                            _.omit(response, ['$ref']),
                            this.getSchemaByPath(response.$ref)
                        );
                    }

                    const fallbackOpenApiData = {};
                    fallbackOpenApiData[defaultContentType] = response.schema || {};

                    // todo пока обрабатываются только контент и заголовки
                    _.each(response.content || fallbackOpenApiData || {}, (
                        content: any,
                        contentType: string
                    ) => {
                        const ctSuffix = (contentType === defaultContentType)
                            ? '' : `_${_.camelCase(contentType)}`;

                        // todo вынести в конфиг правило формирования имени
                        const modelName = this.config.responseModelName(baseTypeName, code, contentType);//`${baseTypeName}${ctSuffix}_response${code}`;

                        if(content.schema || content)
                            result[modelName] = (content.schema || content);

                        // Success responses using as a default response
                        if (Math.round(code / 100) === 2) {
                            metaInfoItem.responseModelName = modelName;
                            metaInfoItem.typingsDependencies.push(modelName);
                            metaInfoItem.responseSchema = result[modelName];
                        }

                        // add description if it's set
                        if (result[modelName] && response.description) {
                            result[modelName].description = response.description;
                        }
                    });

                    if(response.headers) {
                        const modelName = this.config.headersModelName(baseTypeName, code);
                        result[modelName] = {
                            type: "object",
                            properties: response.headers
                        };
                    }
                });

                // оброботка тела запроса
                // todo пока обрабатывается только ContentType по-умолчанию
                const requestBody = _.get(
                    method,
                    `requestBody.content.${defaultContentType}.schema`
                );

                if (requestBody) {
                    let modelName = this.config.requestModelName(baseTypeName);
                    result[modelName] = requestBody;
                    metaInfoItem.typingsDependencies.push(modelName);
                    metaInfoItem.requestModelName = modelName;
                    metaInfoItem.requestSchema = requestBody;
                }

                metaInfo.push(metaInfoItem);
            }
        }

        return result;
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

        const schema = this.getSchemaByPath(path);
        const modelName = (_.trim(path,'/\\').match(/(\w+)$/) || [])[1];

        if (!schema) throw new Error(
            `Error: can't find schema with path: ${path}!`
        );

        const results = this.convert(
            schema,
            context,
            modelName,
            null,
            path
        );

        _.each(results, (result: DataTypeDescriptor) => {
            context[result.originalSchemaPath || result.modelName] = result;
        });

        return results;
    }

    /**
     * Получение сторонней схемы.
     * @param {string} resourcePath
     * URL или путь до файла, содержащего стороннюю схему.
     * @returns {Schema}
     * @private
     */
    protected _getForeignSchema(resourcePath: string): Schema {
        if(this._foreignSchemaFn) {
            return this._foreignSchemaFn(resourcePath);
        } else throw new Error(
            `Function for getting foreign scheme not set. Use setForeignSchemeFn(). Path: ${resourcePath}.`
        );
    }
}
