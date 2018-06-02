import * as _ from 'lodash'
import {
    ObjectTypeScriptDescriptor,
    PropertyDescriptor
} from './descriptors/object'

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
     * List of already rendered params in fabric.
     */
    private _fabricParams: string[];

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

            public static fabric(data: ${this.descr.modelName}): C${this.descr.modelName} {
                return new C${this.descr.modelName}(
                    ${this._fabricParams.join(', ')}
                );
            }

            \n/**\n${propertyComments}\n */
            constructor(${this._constructorArgs.join(',\n')}){}
        }`;
    }

    private _fetchParams(): void {
        const set: PropertyDescriptor[] = _.merge.apply(
            this,
            this.descr.propertiesSets
        );

        this._constructorArgs = [];
        this._constructorComments = [];
        this._fabricParams = [];

        for (const propertyName in set) {
            const descr: PropertyDescriptor = set[propertyName];

            // Definition of argument in constructor
            const constructorArg = `${descr.readOnly ? 'public readonly ' : ''}${
                _.camelCase(propertyName)}${descr.required ? '' : '?'}: ${
                    _.map(
                        descr.typeContainer,
                        type => type.render([], false)
                    ).join(' | ')
                }`;

            this._constructorArgs[descr.required ? 'unshift' : 'push'](
                constructorArg
            );

            this._constructorComments[descr.required ? 'unshift' : 'push'](
                _.concat([
                    [`@param ${_.camelCase(propertyName)}`],
                    _.map(
                        descr.typeContainer,
                        type => type.description || type.title
                    )
                ])
            );

            // fixme there is probability of mismatch beetwen Interface with allowed kebab-case and Class that forces to camelCase
            // fixme has to appear translation from class property to kebab-case if it uses
            this._fabricParams[descr.required ? 'unshift' : 'push'](
                `data['${propertyName}']`
            );
        }
    }
}