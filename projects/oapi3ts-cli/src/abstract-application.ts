import * as _lodash from 'lodash';
import { CliConfig } from './cli-config';
import { sha256 } from 'hash.js';

import {
    Convertor,
    DataTypeDescriptor,
    OApiStructure
} from '@codegena/oapi3ts';

const _ = _lodash;

/**
 * Abstract convertor application.
 * Could have an implementation for CLI or for Browser.
 */
export abstract class AbstractApplication {

    // *** Properties

    protected abstract get destPathAbs(): string;

    protected cliConfig: CliConfig;
    protected convertor: Convertor;
    protected renderedTypings: {[fileName: string]: string};

    // *** Methods

    constructor() {
        this.cliConfig = this.getCliConfig();
        this.convertor = new Convertor(this.cliConfig);
        this.renderedTypings = {};

        if (!this.cliConfig.srcPath) {
            throw new Error('--srcPath is not set!');
        }
    }

    /**
     * Start point of application
     */
    public createTypings(): void {
        this.convertor.loadOAPI3Structure(this.getOApiStructure());

        const context = {};
        const entryPoints = this.convertor.getOAPI3EntryPoints(context);
        const alreadyRendered = [];

        Convertor.renderRecursive(
            entryPoints,
            (
                descriptor: DataTypeDescriptor,
                text,
                depencies: DataTypeDescriptor[]
            ) => {
                const fileName = this.getFilenameOf(descriptor);
                const fileContents = [
                    ...this.cliConfig.separatedFiles
                        ? this.getImports(depencies)
                        : [],
                    text
                ].join('\n');

                this.renderedTypings[fileName] = fileContents;

                if (this.cliConfig.separatedFiles) {
                    this.saveFile(
                        fileName,
                        this.cliConfig.typingsDirectory,
                        fileContents
                    );
                }
            },
            alreadyRendered
        );

        // Indexing file or common typings file
        if (this.cliConfig.separatedFiles) {
            this.saveFile(
                'index',
                this.cliConfig.typingsDirectory,
                _(this.renderedTypings)
                    .keys()
                    .sort()
                    .map(fileName => `export * from './${fileName}'`)
                    .value()
                    .join(';\n')
            );
        } else {
            this.saveFile(
                'index',
                this.cliConfig.typingsDirectory,
                _.values(this.renderedTypings).join('\n')
            );
        }
    }

    /**
     * Get config merged with data from CLI
     */
    protected abstract getCliConfig(): CliConfig;

    /**
     * Obtain the Open API data from a file or other source
     */
    protected abstract getOApiStructure(): OApiStructure;

    /**
     * Put converted file to filesystem or other any output
     * @param fileName
     * Base part of file name without directory and extension
     * @param subdir
     * Subdirectory in base directory
     * @param fileContents
     */
    protected abstract saveFile(
        fileName: string,
        subdir: string,
        fileContents: string
    ): void;

    // Privates

    private getFilenameOf(descriptor: DataTypeDescriptor): string {
        return `${_.kebabCase(descriptor.modelName)}`;
    }

    private getImports(descriptors: DataTypeDescriptor[]): string[] {
        return _(descriptors)
            .sort()
            .map<DataTypeDescriptor, string>(
                (descriptor: DataTypeDescriptor) =>
                    `import { ${descriptor.modelName} } from './${this.getFilenameOf(descriptor)}';`
            )
            .value();
    }
}
