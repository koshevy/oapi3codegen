import * as _lodash from 'lodash';
import { GlobalPartial } from 'lodash/common/common';
import { getArvgParam, getHash, prepareJsonToSave, purifyJson } from './helpers';
import { CliConfig, defaultCliConfig } from './cli-config';
import { AbstractApplication } from './abstract-application';

import { ApiMetaInfo, OApiStructure } from '@codegena/oapi3ts';
import {
    ApiServiceTemplateData,
    createApiServiceWithTemplate
} from '@codegena/ng-api-service';

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
     * @experimental
     * Create service for specified engine
     * @param engine
     * Destination engine. At moment supports only Angular.
     */
    public createServices(engine: 'angular') {
        const context = {}, metaInfoList: ApiMetaInfo[] = [];
        const structure = this.getOApiStructure();
        const schemaId = `schema.${getHash(structure).slice(4, 26).toLowerCase()}`;
        const replacer = purifyJson.bind({ $id: schemaId });

        this.convertor.loadOAPI3Structure(structure);
        this.convertor.getOAPI3EntryPoints(context, metaInfoList);

        const templatesData = _.map<ApiMetaInfo, ApiServiceTemplateData>(
            metaInfoList,
            (metaInfo: ApiMetaInfo) => {
                return {
                    apiSchemaFile: JSON.stringify(`./${schemaId}`),
                    baseTypeName: metaInfo.baseTypeName,
                    method: JSON.stringify(metaInfo.method),
                    paramsModelName: metaInfo.paramsModelName || 'null',
                    paramsSchema: JSON.stringify(metaInfo.paramsSchema, replacer),
                    path: JSON.stringify(metaInfo.path),
                    queryParams: JSON.stringify(metaInfo.queryParams),
                    requestModelName: metaInfo.requestModelName || 'null',
                    requestSchema: JSON.stringify(metaInfo.requestSchema, replacer),
                    responseModelName: metaInfo.responseModelName || 'null',
                    responseSchema: JSON.stringify(metaInfo.responseSchema, replacer),
                    servers: JSON.stringify(metaInfo.servers),
                    typingsDependencies: metaInfo.typingsDependencies,
                    typingsDirectory: this.cliConfig.typingsFromServices
                } as any as ApiServiceTemplateData;
            }
        );

        // Save rendered templates
        _.each(
            templatesData,
            (templateData: ApiServiceTemplateData) => {
                this.saveFile(
                    `${_.kebabCase(templateData.baseTypeName)}.api.service`,
                    this.cliConfig.servicesDirectory,
                    createApiServiceWithTemplate(templateData)
                );
            }
        );

        this.saveSchemaLib(structure, schemaId);
    }

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

        fs.writeFileSync(
            path.resolve(this.destPathAbs, subdir, `${fileName}.ts`),
            fileContents
        );
    }

    /**
     * Save OpenApi components and definitions as library of JSON Schema models
     *
     * @param jsonSchema
     */
    protected saveSchemaLib(
        jsonSchema: OApiStructure,
        schemaId = 'domainSchema'
    ): void {
        this.saveFile(
            schemaId,
            this.cliConfig.servicesDirectory,
            `export const schema = ${
                prepareJsonToSave(jsonSchema, schemaId)
            };\n`
        );
    }
}
