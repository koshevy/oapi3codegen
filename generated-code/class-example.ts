import * as _ from "lodash";
import { Category, Pet, PetStatusEnum, Tag } from "./converted-petstore";

import * as _assert from 'oapi3codegen-assert';

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
        _assert.assertType('name', v, this, 'string');
        _assert.assertEnum('name', v, this, ['Полкан', 'Жучка']);
        this._name = v;
    }

    public get photoUrls(): Array<string> {
        return this._photoUrls;
    }

    public set photoUrls(v: Array<string>) {
        _assert.assertType('photoUrls', v, this, 'array');
        _assert.assertArrayItemsTypes('photoUrls', v, this, 'string');
        this._photoUrls = v;
    }

    public get tags(): Array<Tag> {
        return this._tags;
    }

    public set tags(v: Array<Tag>) {
        _assert.assertType('tags', v, this, 'array');
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

        _assert.assertType(
            'status',
            status,
            this,
            'string'
        );

        _assert.assertEnum(
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
