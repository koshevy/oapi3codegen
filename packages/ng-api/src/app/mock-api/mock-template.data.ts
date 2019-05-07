declare const JSON;

/* tslint:disable */
export const MockApiService = {
    apiSchemaFile: JSON.stringify('../mock-api.schema.json'),
    baseTypeName: 'MockApi',
    method: '\'GET\'',
    paramsModelName: 'MockParams',
    paramsSchema: JSON.stringify({
        $ref: 'mockApiDefinitions#/components/schemas/HeroFilter'
    }),
    path: JSON.stringify('/list'),
    queryParams: JSON.stringify(['universe']),
    responseModelName: 'MockResponse',
    responseSchema: JSON.stringify({
        '200': {
            type: 'array',
            items: { $ref: 'mockApiDefinitions#/components/schemas/Hero' }
        },
        default: { $ref: 'mockApiDefinitions#/components/schemas/Error' }
    }),
    requestModelName: JSON.stringify(null),
    requestSchema: JSON.stringify(null),
    servers: JSON.stringify(["https://heroes.agency/api"]),
    typingsDependencies: ['MockParams', 'MockResponse'],
    typingsDirectory: '../typings'
};
