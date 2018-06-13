const path = require('path');
const fs = require('fs');

module.exports = {
  get(templateName) {
    const apiServiceTemplate = fs.readFileSync(
        path.resolve(__dirname, `./${templateName}.mustache`)
    );

    return apiServiceTemplate;
  }
};
