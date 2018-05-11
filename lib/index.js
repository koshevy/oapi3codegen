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
    // some of India-style coding :D
    try { value = JSON.parse(value); } catch (e) {}
    return value;
  },

  /**
   * Obtaining param sah as `--srcFilename /some/path` from argv.
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
  }
};

module.exports = scope;
