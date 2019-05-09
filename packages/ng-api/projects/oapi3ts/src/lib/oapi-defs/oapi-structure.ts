import * as Components from './components';
import { ObjectWithRef } from './common';

import {
    ParameterIn,
    SchemaArray,
    SchemaInteger,
    SchemaNumber,
    SchemaObject,
    SchemaString
} from './components';

/**
 * This is the root document object of the OpenAPI document.
 *
 * @see https://swagger.io/specification/#openapi-object
 */
export interface OApiStructure {

    /**
     * REQUIRED. This string MUST be the semantic version number of the
     * OpenAPI Specification version that the OpenAPI document uses.
     * The `openapi` field SHOULD be used by tooling specifications and clients
     * to interpret the OpenAPI document. This is not related to the API
     * {@link https://swagger.io/specification/#infoVersion | info.version string}.
     */
    openapi: '3.0.0' | '2.0.0';

    /**
     * REQUIRED. Provides metadata about the API.
     * The metadata MAY be used by tooling as required.
     */
    info: OApiInfo;

    /**
     * An array of Server Objects, which provide connectivity information to a
     * target `server`. If the servers property is not provided, or is an empty array,
     * the default value would be a `Server Object` with a url value of `/`.
     *
     * @see https://swagger.io/specification/#serverObject
     */
    servers: OApiServer[];

    /**
     * REQUIRED. The available paths and operations for the API.
     *
     * @see https://swagger.io/specification/#pathsObject
     */
    paths: OApiPaths;

    /**
     * Holds a set of reusable objects for different aspects of the OAS.
     * All objects defined within the components object will have no effect on
     * the API unless they are explicitly referenced from properties outside the
     * components object.
     *
     * @see https://swagger.io/specification/#componentsObject
     */
    components: OApiReusableComponents;

    /**
     * A declaration of which security mechanisms can be used across the API.
     * The list of values includes alternative security requirement objects that
     * can be used. Only one of the security requirement objects need to be satisfied
     * to authorize a request. Individual operations can override this definition.
     *
     * @see https://swagger.io/specification/#securityRequirementObject
     *
     * TODO describe and implement support of security
     */
    security: any;

    /**
     * A list of tags used by the specification with additional metadata.
     * The order of the tags can be used to reflect on their order by the parsing tools.
     * Not all tags that are used by the
     * {@link https://swagger.io/specification/#operationObject | Operation Object}
     * must be declared. The tags that are not declared MAY be organized randomly
     * or based on the tools' logic. Each tag name in the list MUST be unique.
     *
     * TODO describe and implement support of tags
     */
    tags: any[];

    /**
     * Additional external documentation.
     * @see https://swagger.io/specification/#externalDocumentationObject
     *
     * TODO describe and implement support of externalDocs
     */
    externalDocs?: OApiExternalDocument;
}

/**
 * @see https://swagger.io/specification/#infoObject
 */
export interface OApiInfo {
    contact?: OApiContact;
    description?: string;
    license?: OApiLicense;
    termsOfService?: string;
    title: string;
    version: string;
}

/**
 * @see https://swagger.io/specification/#contactObject
 */
export interface OApiContact {
    email: string;
    name: string;
    url: string;
}

/**
 * @see https://swagger.io/specification/#licenseObject
 */
export interface OApiLicense {
    email: string;
    name: string;
    url?: string;
}

/**
 * @see https://swagger.io/specification/#serverObject
 */
export interface OApiServer {
    /**
     * An optional string describing the host designated by the URL.
     * CommonMark syntax MAY be used for rich text representation.
     */
    description?: string;

    /**
     * REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative,
     * to indicate that the host location is relative to the location where the OpenAPI document is
     * being served. Variable substitutions will be made when a variable is named in {brackets}.
     */
    url: string;

    /**
     * A map between a variable name and its value.
     * The value is used for substitution in the server's URL template.
     *
     * TODO support variables in server. now is not
     * @ see https://swagger.io/specification/#serverVariableObject
     */
    variables: any;
}

/**
 * Holds the relative paths to the individual endpoints and their operations.
 * The path is appended to the URL from the Server Object in order to construct
 * the full URL. The Paths MAY be empty, due to
 * {@link https://swagger.io/specification/#securityFiltering | ACL constraints}.
 *
 * @see https://swagger.io/specification/#pathsObject
 */
export interface OApiPaths {
    /**
     * Field Pattern: /{path}
     */
    [path: string]: OApiPathItem;
}

/**
 * Describes the operations available on a single path. A Path Item MAY be empty,
 * due to {@link https://swagger.io/specification/#securityFiltering | ACL constraints}.
 * The path itself is still exposed to the documentation
 * viewer but they will not know which operations and parameters are available.
 *
 * @see https://swagger.io/specification/#pathItemObject
 */
export interface OApiPathItem extends ObjectWithRef {
    /**
     * An optional, string summary, intended to apply
     * to all operations in this path.
     * TODO support common summary in path. now is not
     */
    summary?: string;

    /**
     * An optional, string description, intended to apply to all
     * operations in this path. CommonMark syntax MAY be used
     * for rich text representation.
     * TODO support common description in path. now is not
     */
    description?: string;

    /**
     * A list of parameters that are applicable for all the operations described
     * under this path. These parameters can be overridden at the operation level,
     * but cannot be removed there. The list MUST NOT include duplicated parameters.
     * A unique parameter is defined by a combination of a name and location.
     * The list can use the Reference Object to link to parameters that are
     * defined at the OpenAPI Object's components/parameters.
     * TODO support common parameters in path. now is not
     */
    parameters: OApiParameter[];

    // Methods:

    delete?: OApiOperation;
    get?: OApiOperation;
    head?: OApiOperation;
    options?: OApiOperation;
    patch?: OApiOperation;
    post?: OApiOperation;
    put?: OApiOperation;
    trace?: OApiOperation;
}

/**
 * Describes a single operation parameter.
 * A unique parameter is defined by a combination of a
 * {@link https://swagger.io/specification/#parameterName | name}
 * and
 * {@link https://swagger.io/specification/#parameterIn | location}.
 *
 * @see https://swagger.io/specification/#parameterObject
 * @see https://swagger.io/docs/specification/describing-parameters/
 */
export interface OApiParameter extends ObjectWithRef, HasExamples {

    /**
     * Determines whether the parameter value SHOULD allow reserved characters,
     * as defined by
     * {@link https://tools.ietf.org/html/rfc3986#section-2.2 | RFC3986}
     * `:/?#[]@!$&'()*+,;=` to be included without percent-encoding.
     * This property only applies to parameters with an `in` value of `query`.
     *
     * The default value is `false`.
     *
     * TODO describe and support allowReserved in parameter. now is not
     */
    allowReserved: boolean;

    /**
     * Sets the ability to pass empty-valued parameters. This is valid only for
     * `query` parameters and allows sending a parameter with an empty value.
     * Default value is `false`.
     * If {@link https://swagger.io/specification/#parameterStyle | style}
     * is used, and if behavior is n/a (cannot be serialized), the value of
     * `allowEmptyValue` SHALL be ignored.
     *
     * @deprecated
     * Use of this property is NOT RECOMMENDED,
     * as it is likely to be removed in a later revision.
     */
    allowEmptyValue?: boolean;

    /**
     * A brief description of the parameter. This could contain examples of use.
     * CommonMark syntax MAY be used for rich text representation.
     */
    description?: string;

    /**
     * Specifies that a parameter is deprecated and SHOULD be transitioned out
     * of usage. Default value is false.
     *
     * TODO describe and support deprecated in parameter. now is not
     */
    deprecated?: boolean;

    /**
     * When this is true, parameter values of type `array` or `object` generate separate parameters
     * for each value of the array or key-value pair of the map. For other types of parameters this
     * property has no effect. When `style` is form, the default value is `true`. For all other
     * styles, the default value is `false`.
     *
     * @see https://swagger.io/docs/specification/serialization/
     * @see OApiParameter.style
     *
     * TODO describe and support explode in parameter. now is not. Important!
     * FIXME describe and support explode in parameter. now is not. Important!
     */
    explode?: boolean;

    /**
     * REQUIRED. The location of the parameter. Possible values are:
     * - "query",
     * - "header"
     * - "path"
     * - "cookie"
     */
    in: ParameterIn;

    /**
     * REQUIRED. The name of the parameter. Parameter names are case sensitive.
     *
     * @see https://swagger.io/specification/#parameterObject
     */
    name: string;

    /**
     * Determines whether this parameter is mandatory. If the `in`
     * is "path", this property is REQUIRED and its value MUST be true.
     * Otherwise, the property MAY be included and its default value is false.
     */
    required: boolean;

    /**
     * @deprecated
     * Not in {@link https://swagger.io/specification/#parameterObject | Open API specification }.
     * Makes extracted schema of params supporting `readonly` params.
     */
    readOnly?: boolean;

    /**
     * The schema defining the type used for the parameter.
     */
    schema?: | SchemaArray
             | SchemaObject
             | SchemaInteger
             | SchemaNumber
             | SchemaObject
             | SchemaString;

    /**
     * Describes how the parameter value will be serialized depending on the
     * type of the parameter value. Default values (based on value of `in`):
     *  - for `'query'` - `'form'`;
     *  - for `'path'` - `'simple'`;
     *  - for `'header'` - `'simple'`;
     *  - for `'cookie'` - `'form'`.
     *
     * @see https://swagger.io/docs/specification/serialization/
     * @see OApiParameter.explode
     *
     * TODO describe and support style in parameter. now is not. Important!
     * FIXME describe and support style in parameter. now is not. Important!
     */
    style?: string;
}

/**
 * @see OApiParameter.in
 */
export enum OApiParameterIn {
    Path = 'path',
    Header = 'header',
    Query = 'query',
    Cookie = 'cookie',
}

/**
 * Describes a single API operation on a path.
 *
 * @see https://swagger.io/specification/#operationObject
 */
export interface OApiOperation {
    /**
     * A map of possible out-of band callbacks related to the parent operation.
     * The key is a unique identifier for the
     * {@link https://swagger.io/specification/#callbackObject | Callback Object }.
     * Each value in the map is a Callback Object that describes a request that may
     * be initiated by the API provider and the expected responses. The key value
     * used to identify the callback object is an expression, evaluated at runtime,
     * that identifies a URL to use for the callback operation.
     *
     * TODO describe and support callbacks. now is not
     */
    callbacks?: any;

    /**
     * Declares this operation to be deprecated. Consumers SHOULD refrain from usage
     * of the declared operation. Default value is false.
     *
     * TODO support depracated operations. now is not
     */
    deprecated?: boolean;

    /**
     * A verbose explanation of the operation behavior.
     * CommonMark syntax MAY be used for rich text representation.
     */
    description?: string;

    /**
     * Additional external documentation for this operation.
     *
     * TODO support operation externalDocs. now is not
     */
    externalDocs?: OApiExternalDocument;

    /**
     * Unique string used to identify the operation. The id MUST be unique among
     * all operations described in the API. The operationId value is case-sensitive.
     * Tools and libraries MAY use the operationId to uniquely identify an operation,
     * therefore, it is RECOMMENDED to follow common programming naming conventions.
     */
    operationId: string;

    /**
     * A list of parameters that are applicable for this operation. If a parameter
     * is already defined at the Path Item, the new definition will override it
     * but can never remove it. The list MUST NOT include duplicated parameters.
     * A unique parameter is defined by a combination of a name and location.
     * The list can use the Reference Object to link to parameters that are defined
     * at the OpenAPI Object's components/parameters.
     */
    parameters?: OApiParameter[];

    /**
     * The request body applicable for this operation. The `requestBody` is only
     * supported in HTTP methods where the HTTP 1.1 specification
     * {@link https://tools.ietf.org/html/rfc7231#section-4.3.1 | RFC7231 } has
     * explicitly defined semantics for request bodies. In other cases where
     * the HTTP spec is vague, `requestBody` SHALL be ignored by consumers.
     */
    requestBody?: OApiRequest;

    /**
     * REQUIRED.
     * The list of possible responses as they are returned from executing this operation.
     */
    responses: {
        /**
         * Default case, when needed status is not described.
         * Usually describe error answers.
         */
        default: Components.Response;

        // Possible codes
        '100': Components.Response;
        '101': Components.Response;
        '102': Components.Response;
        '200': Components.Response;
        '201': Components.Response;
        '202': Components.Response;
        '203': Components.Response;
        '204': Components.Response;
        '205': Components.Response;
        '206': Components.Response;
        '207': Components.Response;
        '208': Components.Response;
        '226': Components.Response;
        '300': Components.Response;
        '301': Components.Response;
        '302': Components.Response;
        '303': Components.Response;
        '304': Components.Response;
        '305': Components.Response;
        '306': Components.Response;
        '307': Components.Response;
        '308': Components.Response;
        '400': Components.Response;
        '401': Components.Response;
        '402': Components.Response;
        '403': Components.Response;
        '404': Components.Response;
        '405': Components.Response;
        '406': Components.Response;
        '407': Components.Response;
        '408': Components.Response;
        '409': Components.Response;
        '410': Components.Response;
        '411': Components.Response;
        '412': Components.Response;
        '413': Components.Response;
        '414': Components.Response;
        '415': Components.Response;
        '416': Components.Response;
        '417': Components.Response;
        '418': Components.Response;
        '419': Components.Response;
        '421': Components.Response;
        '422': Components.Response;
        '423': Components.Response;
        '424': Components.Response;
        '426': Components.Response;
        '428': Components.Response;
        '429': Components.Response;
        '431': Components.Response;
        '449': Components.Response;
        '451': Components.Response;
        '499': Components.Response;
        '501': Components.Response;
        '502': Components.Response;
        '503': Components.Response;
        '504': Components.Response;
        '505': Components.Response;
        '506': Components.Response;
        '507': Components.Response;
        '508': Components.Response;
        '509': Components.Response;
        '510': Components.Response;
        '511': Components.Response;
        '520': Components.Response;
        '521': Components.Response;
        '522': Components.Response;
        '523': Components.Response;
        '524': Components.Response;
        '525': Components.Response;
        '526': Components.Response;
    };

    /**
     * A declaration of which security mechanisms can be used for this operation.
     * The list of values includes alternative security requirement objects that
     * can be used. Only one of the security requirement objects need to be satisfied
     * to authorize a request. This definition overrides any declared top-level security.
     * To remove a top-level security declaration, an empty array can be used.
     *
     * @see https://swagger.io/specification/#securityRequirementObject
     *
     * TODO support operation security. now is not
     */
    security?: [any];

    /**
     * A short summary of what the operation does.
     *
     * TODO support operation summary. now is not
     */
    summary?: string;

    /**
     * An alternative server array to service this operation.
     * If an alternative server object is specified at the Path Item Object or
     * Root level, it will be overridden by this value.
     *
     * TODO support operation servers. now is not. Important!
     * FIXME support operation servers. now is not. Important!
     */
    servers?: [OApiServer | string];

    /**
     * A list of tags for API documentation control. Tags can be used for logical
     * grouping of operations by resources or any other qualifier.
     */
    tags?: string[];
}

/**
 * Allows referencing an external resource for extended documentation.
 */
export interface OApiExternalDocument {
    /**
     * A short description of the target documentation.
     * CommonMark syntax MAY be used for rich text representation.
     */
    description?: string;

    /**
     * REQUIRED. The URL for the target documentation.
     * Value MUST be in the format of a URL.
     */
    url: string;
}

/**
 * Style of parameter serialization.
 * @see https://swagger.io/docs/specification/serialization/
 */
export enum OApiParameterStyle {
    Simple = 'simple',
    Label = 'label',
    Matrix = 'matrix',
    Form = 'form',
    SpaceDelimited = 'spaceDelimited',
    PipeDelimited = 'pipeDelimited',
    DeepObject = 'deepObject'
}

/**
 * Holds a set of reusable objects for different aspects of the OAS. All objects
 * defined within the components object will have no effect on the API unless
 * they are explicitly referenced from properties outside the components object.
 */
export interface OApiReusableComponents {
    /**
     * An object to hold reusable
     * {@link https://swagger.io/specification/#callbackObject | Callback Objects}.
     *
     * TODO describe and support component callbacks. now is not
     */
    callbacks: {
        [key: string]: any;
    };

    /**
     * An object to hold reusable
     * {@link https://swagger.io/specification/#exampleObject | Example Objects}.
     * TODO describe and support component examples. now is not
     */
    examples: {
        [key: string]: any;
    };

    /**
     * An object to hold reusable
     * {https://swagger.io/specification/#headerObject | Header Objects}.
     * TODO describe and support component headers. now is not
     */
    headers: {
        [key: string]: any;
    };

    /**
     * An object to hold reusable
     * {https://swagger.io/specification/#linkObject | Link Objects}.
     * TODO describe and support component links. now is not
     */
    links: {
        [key: string]: any;
    };

    /**
     * An object to hold reusable
     * {@link https://swagger.io/specification/#parameterObject | Parameter Objects }.
     */
    parameters: {
        [key: string]: OApiParameter;
    };

    /**
     * An object to hold reusable
     * {@link https://swagger.io/specification/#requestBodyObject | Request Body Objects }.
     */
    requestBodies: {
        [key: string]: OApiRequest;
    };

    responses: {
        [key: string]: Components.Response;
    };

    securitySchemes: {
        [key: string]: any;
    };

    schemas: {
        [key: string]: Schema
    };
}

/**
 * Request Body Object. Describes a single request body.
 * @see https://swagger.io/specification/#requestBodyObject
 */
export interface OApiRequest extends ObjectWithRef, HasContent {
    /**
     * A brief description of the request body. This could contain examples of
     * use. CommonMark syntax MAY be used for rich text representation.
     */
    description?: string;

    /**
     * Determines if the request body is required in the request. Defaults to `false`.
     */
    required?: boolean;
}

/**
 * Set of media types
 * @see https://swagger.io/specification/#mediaTypeObject
 * @see OApiMediaType
 */
export interface OApiMediaTypes {
    'application/javascript': OApiMediaType;
    'application/json': OApiMediaType;
    'application/octet-stream': OApiMediaType;
    'application/xml': OApiMediaType;
    'application/x-www-form-urlencoded': OApiMediaType;
    'text/html': OApiMediaType;
    'text/plain': OApiMediaType;
    'text/xml': OApiMediaType;
    'image/gif': OApiMediaType;
    'image/jpeg': OApiMediaType;
    'image/pjpeg': OApiMediaType;
    'image/png': OApiMediaType;
    'image/svg+xml': OApiMediaType;
    'multipart/form-data': OApiMediaType;
    'multipart/mixed': OApiMediaType;
    'multipart/related': OApiMediaType;

    /**
     * Any content types
     */
    [mediaType: string]: OApiMediaType;
}

/**
 * Each Media Type Object provides schema and examples for the media type
 * identified by its key.
 *
 * @see https://swagger.io/specification/#mediaTypeObject
 */
export interface OApiMediaType extends HasExamples {

    /**
     * The schema defining the content of the request, response, or parameter.
     */
    schema: Schema;

    /**
     * https://swagger.io/specification/#encodingObject
     * TODO describe and support media type encoding. now is not
     */
    encoding: any;
}

/**
 * Describes a single response from an API Operation, including design-time,
 * static `links` to operations based on the response.
 * @see HasContent
 */
export interface Response extends ObjectWithRef, HasContent {

    /**
     * Maps a header name to its definition. RFC7230 states header names are case
     * insensitive. If a response header is defined with the name "Content-Type",
     * it SHALL be ignored.
     */
    headers: any;

    /**
     * @deprecated
     * Not OAS3: in order to maintain OAS2
     */
    schema: SchemaArray
        | SchemaObject
        | SchemaInteger
        | SchemaNumber
        | SchemaObject
        | SchemaString;

    /**
     * REQUIRED. A short description of the response. CommonMark syntax MAY be
     * used for rich text representation.
     */
    description: string;

    /**
     * Additional external documentation for this operation.
     *
     * TODO support operation externalDocs. now is not
     */
    externalDocs?: OApiExternalDocument;
}

export interface HasContent {
    /**
     * REQUIRED. The content of the request body. The key is a media type or
     * {@link https://tools.ietf.org/html/rfc7231#appendix-D | media type range}
     * and the value describes it. For requests that match multiple keys,
     * only the most specific key is applicable. e.g. `"text/plain"` overrides `"text/*"`
     */
    content: OApiMediaTypes;
}

export interface HasExamples {

    /**
     * Example of the media type. The example object SHOULD be in the correct
     * format as specified by the media type. The `example` field is mutually
     * exclusive of the `examples` field. Furthermore, if referencing a `schema`
     * which contains an `example`, the example value SHALL override the example
     * provided by the schema.
     */
    example: any;

    /**
     * Examples of the media type. Each example object SHOULD match the media
     * type and specified schema if present. The `examples` field is mutually
     * exclusive of the `example` field. Furthermore, if referencing a schema
     * which contains an example, the `examples` value SHALL override the example
     * provided by the schema.
     *
     * TODO describe and support media type examples. now is not
     */
    examples: {
        [key: string]: any;
    };
}

export type Schema = | Components.SchemaArray
                     | Components.SchemaBoolean
                     | Components.SchemaInteger
                     | Components.SchemaNumber
                     | Components.SchemaObject
                     | Components.SchemaString;
