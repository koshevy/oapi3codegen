import * as _ from 'lodash';
import {
    ArgumentMetadata,
    PipeTransform,
} from '@nestjs/common';

/**
 * Parses numbers and booleans in query.
 */
export class TransformQueryPipe<T extends object = object> implements PipeTransform<object> {
    /**
     * Method that accesses and performs optional transformation on argument for
     * in-flight requests.
     *
     * @param value currently processed route argument
     * @param metadata contains metadata about the currently processed route argument
     */
    async transform(value: object, metadata: ArgumentMetadata): Promise<T> {
        return parseValuesOfObject(value);
    }
}

function parseValuesOfObject<T extends object>(data: object): T {
    return _.mapValues<object, any>(data, (value) => {
        if (!value) {
            return null;
        }

        if (_.includes(['true', 'false'], value)) {
            return {
                true: true,
                false: false,
            }[value];
        }

        if ('object' === typeof value) {
            return parseValuesOfObject(value);
        }

        const numValue = Number(value);

        if (!Number.isNaN(numValue)) {
            return numValue;
        } else {
            return value;
        }
    }) as T;
}
