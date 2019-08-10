let CliApplicationClass;

// Try to use local `oapi3ts-cli` build, or go to node_modules on fail
try {
  const { CliApplication } = require('../../../dist/oapi3ts-cli/bundles/codegena-oapi3ts-cli.umd.min.js');
  CliApplicationClass = CliApplication;
} catch(error) {
  const { CliApplication } = require('@codegena/oapi3ts-cli/bundles/codegena-oapi3ts-cli.umd.min.js');
  CliApplicationClass = CliApplication;
}

const cliApp = new CliApplicationClass;

cliApp.createTypings();
cliApp.createServices();
