#!/usr/bin/env node

const path = require('path');
const execa = require('execa');
const fsExtra = require('fs-extra');
const _ = require('lodash');
const { getArvgParam } = require('../lib');

const params = _.mapValues({
    srcPath: undefined,
    destPath: undefined,
    separatedFiles: false
  },
  (v, k) => getArvgParam(k) || v
);

const paramsString = _.compact(_.map(
  params,
  (v, k) => (v !== undefined) ? `--${k} ${v}` : null
)).join(' ');

const cliTsPath = path.resolve(__dirname, '../dist/cli.js');

// first time execution: install packages and compile TS sources
if (!fsExtra.pathExistsSync(cliTsPath)) {
  execa.shellSync([
    'cd ./node_modules/oapi3codegen',
    'npm install',
    'tsc'
  ].join(' && '), {stdout: 'inherit'});
}

// execute CLI interface
console.log(execa.shellSync([
  'cd ./node_modules/oapi3codegen',
  `node ./dist/cli.js ${paramsString}`
].join(' && '), {stdout: 'inherit'}));
