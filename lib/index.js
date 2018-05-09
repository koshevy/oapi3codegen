const _ = require('lodash');

module.exports = {
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
      ? process.argv[index + 1]
      : undefined;
  }
};
