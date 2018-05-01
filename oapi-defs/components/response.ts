import { ObjectWithRef } from "../common";
import { SchemaArray } from "./schema-array";
import { SchemaObject } from "./schema-object";
import { SchemaInteger } from "./schema-integer";
import { SchemaNumber } from "./schema-number";
import { SchemaString } from "./schema-string";

export interface Response extends ObjectWithRef {
    $ref: string;
    content: {
        [header: string]: {
            schema: SchemaArray
                  | SchemaObject
                  | SchemaInteger
                  | SchemaNumber
                  | SchemaObject
                  | SchemaString;
        }
    };
    description: string;
    // todo встречается в нескольких местах. вынести в интерфейс?
    externalDocs: {
        description: string;
        url: string;
    };
}