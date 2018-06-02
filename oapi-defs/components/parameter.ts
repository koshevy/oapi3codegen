import { ObjectWithRef } from "../common";
import { ParameterIn } from "./parameter-in";
import { SchemaArray } from "./schema-array";
import { SchemaObject } from "./schema-object";
import { SchemaInteger } from "./schema-integer";
import { SchemaNumber } from "./schema-number";
import { SchemaString } from "./schema-string";

export interface Parameter extends ObjectWithRef {
    $ref: string;
    description?: string;
    in: ParameterIn;
    name: string;
    required: boolean;
    readOnly: boolean;
    schema: SchemaArray
          | SchemaObject
          | SchemaInteger
          | SchemaNumber
          | SchemaObject
          | SchemaString;
}
