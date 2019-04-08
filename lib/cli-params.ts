import { getArvgParam } from './helpers';

// Source OpenAPI-file (.json)
const srcPath = getArvgParam('srcPath');

// Directory which will contain dist files
const destPath = getArvgParam('destPath');

// Whether should models output in separated files
const separatedFiles = getArvgParam('separatedFiles') || false;

if(!srcPath)
    throw new Error('--srcPath is not set!');

const destPathAbs = destPath
    ? path.resolve(process.cwd(), destPath)
    : path.resolve(process.cwd(), './dist-code');

/**
 * Path for models and types.
 */
const typingsPathAbs = path.resolve(
    destPathAbs,
    convertorConfig.typingsDirectory
);

const servicesPathAbs = path.resolve(
    destPathAbs,
    convertorConfig.servicesDirectory
);

const mocksPathAbs = path.resolve(
    destPathAbs,
    convertorConfig.mocksDirectory
);