/**
 * Helpers for TodoApp:
 * utilities in pure functions.
 */

// *** imports
import * as _ from 'lodash';
import { ToDosItemBlank } from '../../app/api/typings';

/**
 * Regex that retrieves `[x]` from strings such as:
 * ```
 * [x] Close reviews of Andromeda and Big Dipper
 * ```
 */
const taskTextReg = /^\s{0,128}\[\s{0,12}(x|X)\s{0,8}\]\s{0,128}((\S+).+)/;

/**
 * Converts text like this:
 * ```
 * [x] Close reviews of Andromeda and Big Dipper
 * Do planing of sprint Cassiopeia
 * ```
 * to array of {@link ToDosItemBlank}.
 */
export function todosItemsFromText(tasksText: string): ToDosItemBlank[] {
    if (!tasksText) {
        return [];
    }

    const items = _.map<string, ToDosItemBlank>(
        (tasksText || '').split('\n'),
        (srcLine) => {
            const item = {
                description: null,
                isDone: false,
                listUid: 0,
                title: srcLine
            };

            const matches = taskTextReg.exec(item.title)

            if (matches) {
                item.title = matches[2];
                item.isDone = true;
            }

            return item;
        }
    );

    return items;
}

/**
 * Save to local storage data, associated with specified component
 */
export function saveComponentData(
    component: object,
    key: string,
    data: any
): void {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    try {
        key = `${component.constructor.name}__${key}`;
        window.localStorage.setItem(key, JSON.stringify(data));
        console.log('Save', key, data);
    } catch (err) {
        console.error('Can\'t save data to the local storage', data);
    }
}

/**
 * Load from local storage data, associated with specified component
 */
export function loadComponentData(
    component: object,
    key: string
): any {

    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    try {
        key = `${component.constructor.name}__${key}`;

        return JSON.parse(window.localStorage.getItem(key));
    } catch (err) {
        console.error('Can\'t load data from the local storage');
    }
}

export function clearComponentData(
    component: object,
    key: string
) {
    saveComponentData(component, key, null);
}
