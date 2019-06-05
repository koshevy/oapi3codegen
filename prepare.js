const { CliApplication } = require('./dist/oapi3ts-cli/bundles/codegena-oapi3ts-cli.umd.min.js');
const cliApp = new CliApplication;

cliApp.createTypings();
cliApp.createServices();
