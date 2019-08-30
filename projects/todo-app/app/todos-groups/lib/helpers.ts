import * as _ from 'lodash';

import { ToDosGroup, ToDosItem } from '../../api/typings';
import { ToDosGroupTeaser } from './context';

/**
 * Create {@link ToDosGroupTeaser} from {@link ToDosGroup}
 * (adds counters data).
 *
 * @param {ToDosGroup} srcGroup
 * @return {ToDosGroupTeaser}
 */
export function createTodoGroupTeaser(srcGroup: ToDosGroup): ToDosGroupTeaser {
    return {
        ...srcGroup,
        countOfDone: _.filter(
            srcGroup.items || [],
        ({isDone}) => isDone
        ).length,
        totalCount: (srcGroup.items || []).length
    };
}

/**
 * Make an array of {@link ToDosGroupTeaser} from array of {@link ToDosGroup}
 *
 * @param {ToDosGroup[]} srcGroups
 * @return {ToDosGroupTeaser[]}
 */
export function createTodoGroupTeasers(srcGroups: ToDosGroup[]): ToDosGroupTeaser[] {
    return _.map(srcGroups, createTodoGroupTeaser);
}

/**
 * Mark all items in a group as done all undone.
 * @param group
 * @param type
 * @param clearTeaser
 * Should it clear al properties from {@link ToDosGroupTeaser},
 * not specified for {@link ToDosGroup}?
 *
 * @return
 */
export function markGroupAsDone(
    group: ToDosGroup | ToDosGroupTeaser,
    type: 'done' | 'undone' = 'done',
    clearTeaser: boolean = true
): ToDosGroup {
    group.items = _.map(
        group.items,
        (item: ToDosItem) => {
            item.isDone = (type === 'done');

            return item;
        }
    );

    return _.omit(
        group,
        clearTeaser ? ['countOfDone', 'totalCount'] : []
    ) as ToDosGroup;
}

/**
 * Calculates total count of items in groups
 *
 * @param groups
 * @param isDone
 * - true — calculate only done
 * - false — calculate only undone
 * - null — calculate all
 */
export function countItemsInGroups(
    groups: ToDosGroupTeaser[],
    isDone: boolean | null = null
): number {
    return _.reduce(groups || [], (sum, group: ToDosGroupTeaser) => {
        switch (isDone) {
            case true:  return sum + group.countOfDone;
            case false: return sum + group.totalCount - group.countOfDone;
            default:    return sum + group.totalCount;
        }
    }, 0);
}

/**
 * Unified function for adding/changing group in list of groups.
 *
 * @param groupsList
 * Array of {@link ToDosGroupTeaser}, that has to be changed
 * @param groupData
 * {@link ToDosGroupTeaser}-object: will be added to `groupsList`, if there is
 * no objects with `uid` of it's object (or `uid` set in `groupUid` parameter).
 * And change already added items.
 * @param markAs
 * Mark as 'optimistic', 'removing' or 'failed' (only one). If set 'clear', removes
 * other marks. If `null` — clear all marks.
 * @param groupUid
 * "Temporary" uid for optimistic items. Will be overwrite by uid from `groupData`.
 * @return
 * Return copy of array with changed or created item
 */
export function updateGroupsListItem(
    groupsList: ToDosGroupTeaser[],
    groupData: ToDosGroup,
    markAs: | 'optimistic' | 'removing' | 'failed'
            | 'clear' | 'doneOptimistic' | 'undoneOptimistic'
            | null = null,
    groupUid?: number
): ToDosGroupTeaser[] {

    let groupTeaser = createTodoGroupTeaser(groupData);
    groupUid = groupUid ? groupUid : groupData.uid;

    // It may be an already added group or new
    const alreadyAddedIndex = _.findIndex(
        groupsList,
        item => item.uid === groupUid
    );

    switch (markAs) {
        case 'clear':
            groupTeaser.failed = false;
            groupTeaser.optimistic = false;
            groupTeaser.removing = false;
            break;
        case 'doneOptimistic':
            groupTeaser = createTodoGroupTeaser(
                markGroupAsDone(groupTeaser, 'done')
            );

            groupTeaser.failed = false;
            groupTeaser.optimistic = true;
            groupTeaser.removing = false;
            break;
        case 'failed':
            groupTeaser.failed = true;
            groupTeaser.optimistic = false;
            groupTeaser.removing = false;
            break;
        case 'optimistic':
            groupTeaser.optimistic = true;
            groupTeaser.failed = false;
            groupTeaser.removing = false;
            break;
        case 'removing':
            groupTeaser.optimistic = false;
            groupTeaser.failed = false;
            groupTeaser.removing = true;
            break;
        case 'undoneOptimistic':
            groupTeaser = createTodoGroupTeaser(
                markGroupAsDone(groupTeaser, 'undone')
            );

            groupTeaser.failed = false;
            groupTeaser.optimistic = true;
            groupTeaser.removing = false;
            break;
        case null: break;
        default: throw new Error(`Unknown marking type "${markAs}" for updated item!`);
    }

    // add or update
    if (alreadyAddedIndex !== -1) {
        groupsList[alreadyAddedIndex] = groupTeaser;
    } else {
        groupsList.push(groupTeaser);
    }

    // return copy of an array
    return [...groupsList];
}

export function markAllAsDone(
    groups: ToDosGroupTeaser[],
    type: 'done' | 'undone' = 'done',
    optimistic: boolean = false
): ToDosGroupTeaser[] {
    return _.map(groups, (group: ToDosGroupTeaser) =>
        _.assign(
            createTodoGroupTeaser(markGroupAsDone(group, type)),
            {
                failed: false,
                optimistic,
                removing: false
            }
        )
    );
}

export function removeGroupFromList(
    groupsList: ToDosGroupTeaser[],
    uid: number
): ToDosGroupTeaser[] {
    return _.filter(
        groupsList,
        (item: ToDosGroupTeaser) => item.uid !== uid
    );
}
