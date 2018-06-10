import * as _ from 'lodash'
import {
    ObjectTypeScriptDescriptor,
    PropertyDescriptor
} from './descriptors/object'
import {
    ArrayTypeScriptDescriptor
} from './descriptors/array'

/**
 * Класс рендерера для объектов, который превращает их в классы.
 */
export class ClassRenderer {

    // *** Properties

    /**
     * List of already rendered params in constructor.
     */
    private _constructorArgs: string[];

    /**
     * Comments form parameters in constructor.
     */
    private _constructorComments: string[];

    /**
     * List of already rendered param initializations
     * in constructor.
     */
    private _constructorInits: string[];

    /**
     * List of already rendered private parameters,
     * used as a storage for getters/setters.
     */
    private _privateProperties: string[];

    /**
     * List of already rendered params in fabric.
     */
    private _fabricParams: string[];

    private _gettersSetters: string[];

    // *** Methods

    constructor(
        private descr: ObjectTypeScriptDescriptor
    ) {
        this._fetchParams();
    }

    public render(): string {
        const propertyComments = _.map(
            _.compact(_.flattenDeep(this._constructorComments)),
            v => ` * ${v}`
        ).join('\n');

        // fixme move class name template into config
        // fixme move templates into some template engine (? but is it really needed?)
        return `${this.descr.getComments()}export class C${this.descr.modelName} implements ${this.descr.modelName} {

            ${this._privateProperties.join(';\n')}
            
            ${this._gettersSetters.join('\n\n')}

            public static fabric(data: ${this.descr.modelName}): C${this.descr.modelName} {
                return new C${this.descr.modelName}(
                    ${this._fabricParams.join(', ')}
                );
            }

            \n/**\n${propertyComments}\n */
            constructor(${this._constructorArgs.join(',\n')}){
                ${this._constructorInits.join('\n')}
            }
        }`;
    }

    private _fetchParams(): void {
        const set: PropertyDescriptor[] = _.merge.apply(
            this,
            this.descr.propertiesSets
        );

        const constructorAsserts = [];

        this._constructorComments = [];
        this._constructorArgs = [];
        this._constructorInits = [];
        this._fabricParams = [];
        this._privateProperties = [];
        this._gettersSetters = [];

        for (const propertyName in set) {
            const descr: PropertyDescriptor = set[propertyName];
            const camelName = _.camelCase(propertyName);
            const typeOfProp = _.map(
                descr.typeContainer,
                type => type.render([], false)
            ).join(' | ');

            // Definition of argument in constructor
            const constructorArg = `${descr.readOnly ? 'public readonly ' : ''}${
                camelName}${descr.required ? '' : '?'}: ${typeOfProp}`;

            // non-readonly params should have private properties-storages
            if (!descr.readOnly) {
                this._privateProperties.push(
                    `private _${camelName}: ${typeOfProp}`
                );

                this._constructorInits.push(
                    // readonly arguments initializing as a readonly public properties
                    // non-readonly arguments initializing through setters
                    `this.${camelName} = ${camelName};`
                );

                // Getter for this property
                this._gettersSetters.push(
                    `public get ${camelName}(): ${typeOfProp} { return this._${camelName} }`
                );

                // Setter for this property with checks
                this._gettersSetters.push(
                    `public set ${camelName}(value: ${typeOfProp}) {\n${
                        this._renderPropertyChecks(camelName, descr)
                    }\n${this._renderPropertySet(camelName, descr)}\n}`
                );

            } else {
                // Initializations with checks on constructor
                // for readonly properties.
                constructorAsserts.push(
                    this._renderPropertyChecks(camelName, descr)
                );
            }

            this._constructorArgs[descr.required ? 'unshift' : 'push'](
                constructorArg
            );

            this._constructorComments[descr.required ? 'unshift' : 'push'](
                _.concat([
                    [`@param ${camelName}`],
                    _.map(
                        descr.typeContainer,
                        type => type.description || type.title
                    )
                ])
            );

            // fixme there is probability of mismatch beetwen Interface with allowed kebab-case and Class that forces to camelCase
            // fixme has to appear translation from class property to kebab-case if it uses
            this._fabricParams[descr.required ? 'unshift' : 'push'](
                propertyName.match(/\-/)
                    ? `data['${camelName}'] || data['${propertyName}']`
                    : `data.${propertyName}`
            );
        }

        // adds asserts after property initializations
        this._constructorInits = _.concat(
            this._constructorInits,
            constructorAsserts
        );
    }

    private _renderPropertyChecks(propName: string, descr: PropertyDescriptor): string {
        const renderedCode = [];
        const typesOfProperty = _.compact(_.map(
            descr.typeContainer,
            v => v.schema.type || null
        ));

        // adds type check
        renderedCode.push(
            `_assert.assertType('${propName}', this.${propName}, this, ${
                JSON.stringify(typesOfProperty)
            });`
        );

        return renderedCode.join('\n');
    }

    private _renderPropertySet(propName: string, descr: PropertyDescriptor) {

        // scenario when property has only one type
        if (descr.typeContainer.length === 1) {
            const typeDescr = descr.typeContainer[0];

            // properly set of array value
            if (typeDescr instanceof ArrayTypeScriptDescriptor) {
                // ...
                return `this._${propName} = value;`;
            } else if (typeDescr instanceof ObjectTypeScriptDescriptor) {
                // properly set of object value
                const objDescr = <ObjectTypeScriptDescriptor>typeDescr;

                // fixme duplicating of prop name creating: C${objDescr.modelName}. has to get template
                // fixme need to collect dependencies
                const propClassName = `C${objDescr.modelName}`;
                return `
                this._${propName} = (value instanceof C${objDescr.modelName})
                    ? value
                    : C${propClassName}.fabric(value);`
            } else {
                // just set
                return `this._${propName} = value;`;
            }
        } else {
            // scenario when property has few possible types
            // fixme здесь надо проходиться по всем объектам, если их несколько, и валидировать до тех пор, пока не будет найден нужный дескриптор
            // todo have to implements determination of type
            return `this._${propName} = value;`;
        }
    }
}