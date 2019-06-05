import * as _lodash from 'lodash';
import { GlobalPartial } from 'lodash/common/common';
import { getArvgParam } from './helpers';
import { CliConfig, defaultCliConfig } from './cli-config';
import { AbstractApplication } from './abstract-application';

import { OApiStructure } from '@codegena/oapi3ts';

const _ = _lodash;

type Partial<T> = GlobalPartial<T>;

const cliArgs = [
    'destPath',
    'implicitTypesRefReplacement',
    'separatedFiles',
    'srcPath'
];

/**
 * Convertor Application that working in CLI.
 * Uses Node.js filesystem libs.
 */
export class CliApplication extends AbstractApplication {

    // *** Properties

    protected get destPathAbs(): string {
        // No Node.js imports in common file contents!
        // Only by demand: in order to support isomorphism.
        const path = require('path');

        return path.resolve(process.cwd(), this.cliConfig.destPath);
    }

    // *** Methods

    /**
     * Get config merged with data from CLI
     */
    protected getCliConfig(): CliConfig {
        return _.defaults(
            defaultCliConfig,
            _.transform<string, Partial<CliConfig>>(
                cliArgs,
                (result, argName) => {
                    const cliValue = getArvgParam(argName);
                    if (cliValue !== undefined) {
                        defaultCliConfig[argName] = cliValue;
                    }
                },
                {}
            )
        );
    }

    /**
     * Obtain the Open API data from a file or other source
     */
    protected getOApiStructure(): OApiStructure {
        // No Node.js imports in common file contents!
        // Only by demand: in order to support isomorphism.
        const fs = require('fs');

        return JSON.parse(fs.readFileSync(this.cliConfig.srcPath));
    }

    /**
     * Put converted file to filesystem or other any output
     * @param fileName
     * Base part of file name without directory and extension
     * @param subdir
     * Subdirectory in base directory
     * @param fileContents
     */
    protected saveFile(fileName: string, subdir: string, fileContents: string): void {
        // No Node.js imports in common file contents!
        // Only by demand: in order to support isomorphism.
        const fs = require('fs');
        const path = require('path');
        const dir = path.resolve(this.destPathAbs, subdir);

        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir);
            } catch (err) {
                console.error(`Directory creation failed: ${dir}`);
            }
        }

        fs.writeFileSync(
            path.resolve(dir, `${fileName}.ts`),
            `${fileContents}\n`
        );
    }
}
