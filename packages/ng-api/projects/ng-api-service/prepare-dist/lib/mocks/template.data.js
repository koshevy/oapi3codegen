"use strict";
exports.__esModule = true;
/* tslint:disable */
exports.FindPetsService = {
    apiSchemaFile: JSON.stringify('../lib/mocks/oapi-specs/pet-shop.json'),
    baseTypeName: 'FindPets',
    method: '\'GET\'',
    paramsModelName: 'FindPetsParams',
    paramsSchema: JSON.stringify({
        type: 'object',
        properties: {
            tags: {
                type: "array",
                items: {
                    type: "string"
                }
            },
            limit: {
                type: "integer",
                format: "int32"
            }
        }
    }),
    path: JSON.stringify('/pets'),
    queryParams: JSON.stringify(['tags', 'limit']),
    responseModelName: 'FindPetsResponse',
    responseSchema: JSON.stringify({
        '200': {
            "type": "array",
            "items": {
                "$ref": "petShop#/components/schemas/Pet"
            }
        },
        'default': {
            "$ref": "petShop#/components/schemas/Error"
        }
    }),
    requestModelName: 'null',
    requestSchema: JSON.stringify(null),
    servers: JSON.stringify(['http://petstore.swagger.io/api']),
    typingsDependencies: ['FindPetsParams', 'FindPetsResponse'],
    typingsDirectory: '../lib/mocks/typings'
};
