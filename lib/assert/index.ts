/**
 * Class of error that throws in case of assertion fail.
 */
export class AssertionError extends Error {
    constructor(message, typeName, v, schema?) {
        super(message);
        console.error(`Validation error: ${typeName}.`);
        console.error('Value is:');
        console.error(v);
        console.error(message);
        console.error(schema);
    }
}

/**
 * Assertion with type check
 * @param propName
 * Name of property that asserts
 * @param v
 * Value for check
 * @param obj
 * Object contains property
 * @param type
 * Type supposed in assertion:
 * - boolean
 * - number
 * - integer
 * - string
 * - object
 * - array
 */
export function assertType(
    propName: string,
    v: any,
    obj: any,
    type: string
) {
    const className = obj
        ? obj.constructor.name
        : '[unknown object]'

    let oppositeCondition;

    switch (type) {
        case 'array':
            oppositeCondition = (('object' !== typeof v) || 1);
            break;
        case 'integer':
            if (Number['isInteger']) {
                oppositeCondition = Number['isInteger'](v);
                break;
            }
        default:
            oppositeCondition = (type !== typeof v);
    }

    if(oppositeCondition)
        throw new AssertionError(
            `${className}.${propName} should be ${type}`,
            className,
            v
        );
}

/**
 * Assertion with RegExp match check
 * @param propName
 * Name of property that asserts
 * @param v
 * Value for check
 * @param obj
 * Object contains property
 * @param reg
 * RegExp supposed to match
 */
export function assertMatch(
    propName: string,
    v: string,
    obj: any,
    reg: RegExp
) {
    if(!v.match(reg))
        throw new AssertionError(
            `${obj.constructor.name}.${propName} should match ${reg}`,
            obj.constructor.name,
            v
        );
}

/**
 * Assertion with check of min and max values of value
 * @param propName
 * Name of property that asserts
 * @param v
 * Value for check
 * @param obj
 * Object contains property
 * @param reg
 * RegExp supposed to match
 */
export function assertBetween(
    propName: string,
    v: number,
    obj: any,
    values: [number, number]
) {
    if(v < values[0]) {
        throw new AssertionError(
            `${obj.constructor.name}.${propName} should be equal or more than ${values[0]}`,
            obj.constructor.name,
            v
        );
    }

    if(v > values[1]) {
        throw new AssertionError(
            `${obj.constructor.name}.${propName} should be equal or greater than ${values[1]}`,
            obj.constructor.name,
            v
        );
    }
}

/**
 * Assertion with check whether value in range of enum
 * @param propName
 * Name of property that asserts
 * @param v
 * Value for check
 * @param obj
 * Object contains property
 * @param v
 * @param obj
 * @param enumValues
 */
export function assertEnum(
    propName: string,
    v: any,
    obj: any,
    enumValues: any[]
) {
    if (enumValues.indexOf(v) === -1) {
        throw new AssertionError(
            `${obj.constructor.name}.${propName} is out of enum values!`,
            obj.constructor.name,
            v
        );
    }
}

/**
 *
 * @param propName
 * @param v
 * @param obj
 * @param type
 */
export function assertArrayItemsTypes(
    propName: string,
    v: any[],
    obj: any,
    type: string
) {
    for (let i in v) {
        assertType(
            i,
            v[i],
            v,
            type
        );
    }
}