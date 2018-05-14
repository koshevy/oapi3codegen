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

// work in curent dir, not in plugin dir
if(!params.destPath) {
  params.destPath = path.resolve(process.cwd(), './generated-code');
}

const paramsString = _.compact(_.map(
  params,
  (v, k) => (v !== undefined) ? `--${k} ${v}` : null
)).join(' ');

const cliTsPath = path.resolve(__dirname, '../dist/cli.js');

// default plugin dir: for local install
let oapi3codegenDir = path.resolve(
  process.cwd(),
  './node_modules/oapi3codegen'
);

// plugin dir for global install
if(!fsExtra.pathExistsSync(oapi3codegenDir)) {
  oapi3codegenDir = path.resolve(path.dirname(process.mainModule.filename), '../');
}

// first time execution: install packages and compile TS sources
if (!fsExtra.pathExistsSync(cliTsPath)) {
  execa.shellSync([
    `cd ${oapi3codegenDir}`,
    'npm install',
    'tsc'
  ].join(' && '), {stdout: 'inherit'});
}

// execute CLI interface
execa.shellSync([
  `cd ${oapi3codegenDir}`,
  `node ./dist/cli.js ${paramsString}`
].join(' && '), {stdout: 'inherit'});
