import * as Components from './components';
import { OApiInfo } from './oapi-info';
import { OApiPath } from "./oapi-path";

type Schema = Components.SchemaArray
            | Components.SchemaBoolean
            | Components.SchemaInteger
            | Components.SchemaNumber
            | Components.SchemaObject
            | Components.SchemaString;

export interface OApiStructure {
    info: OApiInfo;
    paths: OApiPath;
    servers: Array<{
        description: string,
        url: string
    }>,
    components: {
        parameters: {
            [key: string]: Components.Parameter
        }
        responses: {
            [key: string]: Components.Response
        },
        schemas: {
            [key: string]: Schema
        }
    }
}