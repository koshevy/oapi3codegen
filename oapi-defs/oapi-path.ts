import * as Components from "./components";

export interface OApiPath {
    [path: string]: {
        [method: string]: {
            tags: string[],
            summary: string,
            description: string,
            operationId: string,
            requestBody: Components.Schema,
            parameters: Array<Components.Parameter>,
            responses: { [key: string]: Components.Response }
        }
    }
}
