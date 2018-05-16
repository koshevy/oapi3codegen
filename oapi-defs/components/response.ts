import { ObjectWithRef } from "../common";
import { SchemaArray } from "./schema-array";
import { SchemaObject } from "./schema-object";
import { SchemaInteger } from "./schema-integer";
import { SchemaNumber } from "./schema-number";
import { SchemaString } from "./schema-string";

export interface Response extends ObjectWithRef {
    $ref: string;
    headers: SchemaArray
           | SchemaObject
           | SchemaInteger
           | SchemaNumber
           | SchemaObject
           | SchemaString;
    content: {
        [contentType: string]: {
            schema: SchemaArray
                  | SchemaObject
                  | SchemaInteger
                  | SchemaNumber
                  | SchemaObject
                  | SchemaString;
        }
    };

    /**
     * Not OAS3: in order to maintain OAS2
     */
    schema: SchemaArray
          | SchemaObject
          | SchemaInteger
          | SchemaNumber
          | SchemaObject
          | SchemaString;

    description: string;
    // todo встречается в нескольких местах. вынести в интерфейс?
    externalDocs: {
        description: string;
        url: string;
    };
}