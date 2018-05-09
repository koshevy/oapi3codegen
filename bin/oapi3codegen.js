#!/usr/bin/env node

const execa = require('execa');

console.log(process);
console.log('———');

// создание компонента
execa.shellSync([
  `tsc && node ./dist/cli.js`
].join(' && '), {stdout: 'inherit'});