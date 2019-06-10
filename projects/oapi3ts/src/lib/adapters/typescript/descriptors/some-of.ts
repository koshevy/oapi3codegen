import * as _lodash from 'lodash';
import {
    DataTypeDescriptor,
    DataTypeContainer
} from '../../../core/data-type-descriptor';
import { BaseConvertor, Schema } from '../../../core';
import { AbstractTypeScriptDescriptor } from './abstract';

enum SomeOfType {
    OneOf = 'oneOf',
    AllOf = 'allOf',
    AnyOf = 'anyOf'
}

const _ = _lodash;

/**
 * Дескриптор для обслуживания конструкций-вариантов:
 *
 *  - oneOf
 *  - anyOf
 *  - allOf
 */
// fixme allOf должны проверять типы
// fixme (не может number смешиваться с object) и проставлять extends для интерфейсов
// fixme allOf should make common interface (if it s a object) and set "extends"
export class SomeOfTypeScriptDescriptor
    extends AbstractTypeScriptDescriptor
    implements DataTypeDescriptor {

    /**
     * Описания вариантов, которые являются частью типа.
     * При рендеринге будут исключены те типы, которые
     * рендерятся в одинаковый результат.
     */
    public variants: DataTypeContainer;

    /**
     * `anyOf` | `oneOf` | `allOf`
     */
    protected conditionType: SomeOfType;

    constructor(

        public schema: any,

        /**
         * Родительский конвертор, который используется
         * чтобы создавать вложенные дескрипторы.
         */
        protected convertor: BaseConvertor,

        /**
         * Рабочий контекст
         */
        public readonly context: {[name: string]: DataTypeDescriptor},

        /**
         * Название этой модели (может быть string
         * или null).
         */
        public readonly modelName: string,

        /*
         * Предлагаемое имя для типа данных: может
         * применяться, если тип данных анонимный, но
         * необходимо вынести его за пределы родительской
         * модели по-ситуации (например, в случае с Enum).
         */
        public readonly suggestedModelName: string,

        /**
         * Путь до оригинальной схемы, на основе
         * которой было создано описание этого типа данных.
         */
        public readonly originalSchemaPath: string

    ) {
        super(
            schema,
            convertor,
            context,
            modelName,
            suggestedModelName,
            originalSchemaPath
        );

        if (!schema.oneOf && !schema.anyOf && !schema.allOf) {
            throw new Error([
                'Error: descriptor, recognized as "SomeOf"',
                'should have "oneOf", "anyOf" or "allOf" properties.'
            ].join(' '));
        }

        let suggestedNameBase = (modelName || suggestedModelName);
        let subSchemas;

        if (suggestedNameBase) {
            suggestedNameBase = suggestedNameBase.replace(
                /^./, suggestedNameBase[0]
            );
        }

        // обработка разных вариантов
        const commonPart = _.omit(schema, ['oneOf', 'anyOf', 'allOf']);

        if (schema.oneOf) {
            this.conditionType = SomeOfType.OneOf;
        } else if (schema.anyOf) {
            this.conditionType = SomeOfType.AnyOf;
        } else if (schema.allOf) {
            this.conditionType = SomeOfType.AllOf;
        }

        subSchemas = this._getSomeOfSchemes(
            schema,
            commonPart,
            this.conditionType
        );

        this.variants = _(subSchemas)
            .map<Schema, DataTypeDescriptor[]>((variant, i) => {
                return convertor.convert(
                    _.merge(_.cloneDeep(commonPart), variant),
                    context,
                    null,
                    suggestedNameBase
                        ? `${suggestedNameBase}_${i}`
                        : null
                );
            })
            .flattenDeep<DataTypeDescriptor>()
            .value();
    }

    /**
     * Рендер типа данных в строку.
     *
     * @param childrenDependencies
     * Immutable-массив, в который складываются все зависимости
     * типов-потомков (если такие есть).
     * @param rootLevel
     * Говорит о том, что это рендер "корневого"
     * уровня — то есть, не в составе другого типа,
     * а самостоятельно.
     *
     */
    public render(
        childrenDependencies: DataTypeDescriptor[],
        rootLevel: boolean = true
    ): string {
        const comment = this.getComments();
        const variantsSeparator = (this.conditionType === SomeOfType.AllOf)
            ? ' & '
            : ' | ';

        const result = `${rootLevel ? `${comment}export type ${this.modelName} = ` : ''}${
            this.variants
                ? _.uniq(_.map(
                    this.variants,
                    (descr: DataTypeDescriptor) => [
                        descr.render(childrenDependencies, false),
                        (   (typeof descr.schema['description'] === 'string')
                            && (descr.schema['description'] !== this.schema['description'])
                        )
                            ? `// ${descr.schema['description'].replace(/\s+/, ' ')}\n`
                            : ''
                    ].join(' ') + '\n'
                )).join(variantsSeparator)
                : 'any'
        }`;

        return rootLevel
            ? this.formatCode(result)
            : result;
    }

    /**
     * Получение схем для конвертации, которые исходят
     * из условий 'allOf', 'anyOf', 'allOff'
     *
     * @param schema
     * @param commonPart
     * @param type
     */
    private _getSomeOfSchemes(schema, commonPart, type: SomeOfType): any[] {
        let schemes = [];

        switch (type) {
            case SomeOfType.AllOf:
                schemes = _.flattenDeep([schemes, schema[type]]);

            case SomeOfType.AnyOf:
            case SomeOfType.OneOf:
                schemes = _.flattenDeep([schemes, schema[type]]);
        }

        // ко всем вариантам "подмещивается" общая часть
        return schemes;
    }
}
