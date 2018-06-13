/**
 * Meta-information about api method.
 */
export interface ApiMetaInfo {

    path: string;

    method: string;

    baseTypeName: string

    apiSchemaFile: string;

    typingsDependencies: string[];

    typingsDirectory: string;

    responseModelName: string;

    requestModelName: string;

    paramsModelName: string;

    queryParams: string[];

    servers: string[];

    responseSchema: any;

    requestSchema: any;

    paramsSchema: any;

    mockData: any;
}