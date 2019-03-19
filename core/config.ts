import * as _ from 'lodash';

/**
 * Интерфейс конфигурации для ковертора.
 */
export interface ConvertorConfig {
    /**
     * Default content-type contains no prefixes/suffixes
     * in type names.
     */
    defaultContentType: string,

    defaultContentTypeKey: string,

    /**
     * Regex which is using for extract JSON Path parts.
     */
    jsonPathRegex: RegExp,

    /**
     * Mode when models that refer to any models via `$ref`
     * replacing implicitly even firsts have names.
     *
     * For example, in this case:
     * ```yml
     * components:
     *   schemas:
     *      FistModel:
     *          $ref: SecondModel
     *      SecondModel:
     *          type: object
     *          properties:
     *              exampleProperty:
     *                  type: string
     * ```
     *
     * `FirstModel` will be replaced by `SecondModel` in every
     * place when `implicitTypesRefReplacement=true` but otherwise
     * `SecondModel` will be rendered as interface such extends `FistModel`.
     *
     */
    implicitTypesRefReplacement: boolean,

    /**
     * Function that create Parameters Model name.
     * Headers Model is a implicit model that based on
     * Open API description of request body for API method.
     *
     * @param baseTypeName
     * @param code
     * @param contentType
     * @returns {string}
     * fixme contentType is not using now
     */
    parametersModelName: (baseTypeName) => string,

    /**
     * Function that create Headers Model name.
     * Headers Model is a implicit model that based on
     * Open API description of headers for method.
     *
     * @param baseTypeName
     * @param code
     * @param contentType
     * @returns {string}
     * fixme contentType is not using now
     */
    headersModelName: (baseTypeName, code, contentType?) => string,

    /**
     * Function that create Request Model name.
     * Headers Model is a implicit model that based on
     * Open API description of request body for API method.
     *
     * @param baseTypeName
     * @param code
     * @param contentType
     * @returns {string}
     * fixme contentType is not using now
     */
    requestModelName: (baseTypeName, contentType?) => string,

    /**
     * Function that create Response Model name.
     * Headers Model is a implicit model that based on
     * Open API description of parameters for API method.
     *
     * @param baseTypeName
     * @param contentType
     * @param code
     * @returns {string}
     * fixme contentType is not using now
     */
    responseModelName: (baseTypeName, code, contentType?) => string,

    /**
     * Name of directory with extracted models and types.
     */
    typingsDirectory: string;

    /**
     * Name of directory with generated API-services
     * for Angular.
     */
    servicesDirectory: string

    mocksDirectory: string
}

/**
 * Настройки конфига по-умолчанию.
 * @type {ConvertorConfig}
 */
export const defaultConfig: ConvertorConfig = {

    /**
     * Default content-type contains no prefixes/suffixes
     * in type names.
     */
    defaultContentType: "application/json",

    defaultContentTypeKey: 'json',

    /**
     * Regex which is using for extract JSON Path parts.
     */
    jsonPathRegex: /([\w:\/\\\.]+)?#(\/?[\w+\/?]+)/,

    /**
     * Mode when models that refer to any models via `$ref`
     * are replacing implicitly even if firsts have names.
     *
     * For example, in this case:
     * ```yml
     * components:
     *   schemas:
     *      FistModel:
     *          $ref: SecondModel
     *      SecondModel:
     *          type: object
     *          properties:
     *              exampleProperty:
     *                  type: string
     * ```
     *
     * `FirstModel` will be replaced by `SecondModel` in every
     * place when `implicitTypesRefReplacement=true` but otherwise
     * `SecondModel` will be rendered as interface such extends `FistModel`.
     *
     */
    implicitTypesRefReplacement: false,

    /**
     * Function that create Parameters Model name.
     * Headers Model is a implicit model that based on
     * Open API description of request body for API method.
     *
     * @param baseTypeName
     * @param code
     * @param contentType
     * fixme contentType не используется
     */
    parametersModelName: (baseTypeName) => `${baseTypeName}Parameters`,

    /**
     * Function that create Headers Model name.
     * Headers Model is a implicit model that based on
     * Open API description of headers for method.
     *
     * @param baseTypeName
     * @param code
     * @param contentType
     * @returns {string}
     * fixme contentType is not using now
     */
    headersModelName: (baseTypeName, code, contentType = null) =>
        `${baseTypeName}HeadersResponse${code}`,

    /**
     * Function that create Request Model name.
     * Headers Model is a implicit model that based on
     * Open API description of request body for API method.
     *
     * @param baseTypeName
     * @param code
     * @param contentType
     * @returns {string}
     * fixme contentType is not using now
     */
    requestModelName: (baseTypeName, contentType = null) =>
        `${baseTypeName}Request`,

    /**
     * Function that create Response Model name.
     * Headers Model is a implicit model that based on
     * Open API description of parameters for API method.
     *
     * @param baseTypeName
     * @param contentType
     * @param code
     * @returns {string}
     * fixme contentType is not using now
     */
    responseModelName: (baseTypeName, code, contentTypeKey = null) =>
        `${baseTypeName}${
            (contentTypeKey && contentTypeKey !== defaultConfig.defaultContentTypeKey) 
                ? `_${_.capitalize(contentTypeKey)}`
                : ''
        }Response${code != 200 ? code : ''}`,

    /**
     * Name of directory with extracted models and types.
     */
    typingsDirectory: './typings',

    /**
     * Name of directory with generated API-services
     * for Angular.
     */
    servicesDirectory: './services',

    mocksDirectory: './mocks'
};
