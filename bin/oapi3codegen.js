const execa = require('execa');

console.log(process);
console.log('———');

// создание компонента
execa.shellSync([
  `cd ../`,
  `tsc && node ./dist/cli.js`
].join(' && '), {stdout: 'inherit'});