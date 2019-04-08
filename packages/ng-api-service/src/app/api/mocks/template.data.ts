import {ApiServiceTemplateData} from "../templates";

export const findPets: ApiServiceTemplateData = {
    apiSchemaFile: JSON.stringify('./api/mocks/pet-shop.json'),
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
    queryParams: ['tags', 'limit'],
    responseModelName: 'FindPetsResponse',
    responseSchema: JSON.stringify({
        '200': {
            "description": "pet response",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/Pet"
                        }
                    }
                }
            }
        },
        'default': {
            "description": "unexpected error",
            "content": {
                "application/json": {
                    "schema": {
                        "$ref": "#/components/schemas/Error"
                    }
                }
            }
        }
    }),
    requestModelName: 'null',
    requestSchema: JSON.stringify(null),
    servers: [JSON.stringify('http://petstore.swagger.io/api')],
    typingsDependencies: ['FindPetsParams', 'FindPetsResponse'],
    typingsDirectory: './typings/pets'
};
