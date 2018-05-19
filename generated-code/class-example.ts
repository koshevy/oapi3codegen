import * as _ from "lodash";
import { Category, Pet, PetStatusEnum, Tag } from "./converted-petstore";

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

function assertType(propName, v, obj, type) {
    const oppositeCondition = (type === 'array')
        ? (('object' !== typeof v) || 1)
        : (type !== typeof v)
    if(oppositeCondition)
        throw new AssertionError(
            `${obj.constructor.name}.${propName} should be ${type}`,
            obj.constructor.name,
            v
        );
}

function assertMatch(propName, v, obj, reg) {
    if(!v.match(reg))
        throw new AssertionError(
            `${obj.constructor.name}.${propName} should match ${reg}`,
            obj.constructor.name,
            v
        );
}

function assertBetween(propName, v, obj, reg) {
    // ...
}

function assertEnum(propName, v, obj, enumValues) {
    // ...
}

function assertArrayItemsTypes(propName, v, obj, type) {
    // ...
}

export class TagClass implements Tag {
    id: number;
    name: string;

    public static fabric(data: Tag): TagClass {
        return null;
    }
}

export class CategoryClass implements Category{
    id: number;
    name: string;

    public static fabric(data: Tag): Category {
        return null;
    }
}

/**
 * Example: such could be auto-generated class
 *
 * @property name
 * @property photoUrls
 */
export class PetClass implements Pet{

    private _name: string;
    private _photoUrls: Array<string>;
    private _tags: Array<Tag>;
    private _status: PetStatusEnum;
    private _category: Category;

    public get name(): string {
        return this._name;
    }

    public set name(v) {
        assertType('name', v, this, 'string');
        assertEnum('name', v, this, ['Полкан', 'Жучка']);
        this._name = v;
    }

    public get photoUrls(): Array<string> {
        return this._photoUrls;
    }

    public set photoUrls(v: Array<string>) {
        assertType('photoUrls', v, this, 'array');
        assertArrayItemsTypes('photoUrls', v, this, 'string');
        this._photoUrls = v;
    }

    public get tags(): Array<Tag> {
        return this._tags;
    }

    public set tags(v: Array<Tag>) {
        assertType('tags', v, this, 'array');
        this._tags = _.map(v, v => {
            this._category =  (v instanceof TagClass)
                ? v : CategoryClass.fabric(v);
        });
    }

    public get status(): PetStatusEnum {
        return this._status;
    }

    public static fabric(data: Pet): PetClass {
        return new PetClass(
            data.id,
            data.name,
            data.photoUrls,
            data.category,
            data.tags
        );
    }

    constructor(

        public readonly id: number,

        name: string,

        photoUrls: Array<string>,

        /**
         * ## Category
         * read-only too: have getter, but no setter
         */
        category?: Category,

        tags?: Array<Tag>,

        /**
         * ## Status6
         * pet status in the store
         * read-only too: have getter, but no setter
         */
        status?: PetStatusEnum
    ) {

        // Here ajv-validation

        // ...

        // Checks are in setters (not read-only, therefore — have setters)
        this.name = name;
        this.photoUrls = photoUrls;
        this.tags = tags;

        // Checks read-only elements, that's
        // no setters, but have a validation

        assertType(
            'status',
            status,
            this,
            'string'
        );

        assertEnum(
            'status',
            status,
            this,
            ["available", "pending", "sold"]
        );

        // Checks above: here read-only (read-only, have setters)
        this._category =  (category instanceof CategoryClass)
            ? category : CategoryClass.fabric(category);

        this._status = status;
    }
}
