import * as _ from 'lodash';

/**
 * Интерфейс конфигурации для ковертора.
 */
export interface ConvertorConfig {
    /**
     * Content-Type по-умолчанию.
     * На данный момент, обрабатываются только ContentType по-умолчанию.
     */
    defaultContentType: string,

    /**
     * Регулярное выражение для расшифровки JSON Path.
     */
    jsonPathRegex: RegExp,

    /**
     * Формирование имени модели с заголовками для метода API.
     * @param baseTypeName
     * @param code
     * @param contentType
     * @returns {string}
     * fixme contentType не используется
     */
    headersModelName: (baseTypeName, code, contentType?) => string,

    /**
     * Формирование имени модели для запроса на метод API.
     * @param baseTypeName
     * @param code
     * @param contentType
     * fixme contentType не используется
     */
    requestModelName: (baseTypeName, contentType?) => string,

    /**
     * Формирование имени модели для ответа метода API.
     * @param baseTypeName
     * @param contentType
     * @param code
     * @returns {string}
     */
    responseModelName: (baseTypeName, code, contentType?) => string,
}

/**
 * Настройки конфига по-умолчанию.
 * @type {ConvertorConfig}
 */
export const defaultConfig: ConvertorConfig = {

  defaultContentType: "application/json",
  jsonPathRegex: /([\w:\/\\\.]+)?#(\/?[\w+\/?]+)/,

  /**
   * Формирование имени модели с заголовками для метода API.
   * @param baseTypeName
   * @param code
   * @param contentType
   * @returns {string}
   * fixme contentType не используется
   */
  headersModelName: (baseTypeName, code, contentType = null) => {
      return `${baseTypeName}Headers_response${code}`;
  },

  /**
   * Формирование имени модели для запроса на метод API.
   * @param baseTypeName
   * @param code
   * @param contentType
   * fixme contentType не используется
   */
  requestModelName: (baseTypeName, contentType = null) => {
      return `${baseTypeName}Request`
  },

  /**
   * Формирование имени модели для ответа метода API.
   * @param baseTypeName
   * @param contentType
   * @param code
   * @returns {string}
   */
  responseModelName: (baseTypeName, code, contentType = null) => {
    return `${baseTypeName}${contentType ? `_${_.camelCase(contentType)}` : ''}_response${code}`
  }
};
