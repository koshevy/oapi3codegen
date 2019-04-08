const _ = require('lodash');

const scope = {

  /**
   * Parse value from CL to JS correct value.
   * For example: `-- separatedFiles false` should be
   * parsed as a `false`, but not `"false"`.
   * @param value
   */
  parseCliArg(value) {
    value = String(value).trim();
    // some of Indian-style coding :D
    if (value !== undefined) {
      try { value = JSON.parse(value); } catch (e) {}
    }
    return value;
  },

  /**
   * Obtaining param such as `--srcFilename /some/path` from argv.
   * @param paramName
   * Param name without dashes, for example: `srcFilename`.
   * @returns {string}
   * Returns only value like `/some/path`.
   */
  getArvgParam: function  (paramName) {
    const index = _.findIndex(
      process.argv || [],
      v => v === `--${paramName}`
    );

    return (index !== -1)
      ? scope.parseCliArg(process.argv[index + 1])
      : undefined;
  },

  /**
   * Function has to be used as a replacer for
   * the JSON.stringify at exporting source JSON Schema
   * external file.
   *
   * @param cutoffStringProperties
   * @param cutoffAnyProperties
   * @returns {Function}
   */
  jsonPrepareJsonSchemaForServices: function(
    cutoffStringProperties = [
      'description',
      'title'
    ],
    cutoffAnyProperties = [
      'example'
    ]
  ) {
    return function (key, value) {
      // adding supports of Swagger's `nullable`
      if (_.isObject(value) && value.nullable) {
        delete value.nullable;
        const schemaCopy = _.cloneDeep(value);

        return {
          anyOf: [
            {
              type: 'null',
              description: 'OApi Nullable'
            },
            schemaCopy
          ]
        };
      }

      // cut off titles and descriptions
      if (
        _.includes(['description', 'title'], key)
        && ('string' === typeof key)) {

        return undefined;
      }

      // cut off examples
      if (key === 'example') {
        return undefined;
      }

      return value;
    }
  }
};

module.exports = scope;
