import * as _ from 'lodash';
import * as generateUid from 'nanoid';
import {
    ToDoGroup,
    ToDoGroupBlank,
    ToDoTask,
    ToDoTaskBlank,
} from './schema/typings';
import { BadRequestException } from "@nestjs/common";

const nowISO = getNowISO();

export function getNowISO(): string {
    const date = new Date();
    return date.toISOString();
}

/**
 * Function gives blank of group and returns complete record
 * with `dateChanged`, `dateCreated` and `uid`.
 *
 * @param groupBlank
 * @return
 */
export function createGroupFromBlank(groupBlank: ToDoGroupBlank): ToDoGroup {
    const groupUid = generateUid();
    const items = _.map(
        (groupBlank.items || []),
        (blankTask: ToDoTaskBlank, index) => {
            return createTaskFromBlank(
                blankTask,
                index,
                groupUid,
            );
        },
    );

    return {
        ...groupBlank,
        dateChanged: nowISO,
        dateCreated: nowISO,
        items,
        uid: groupUid,
    };
}

/**
 * Function gives blank of task and returns complete record
 * with `dateChanged`, `dateCreated` and `uid`.
 *
 * @param blank
 * @param position
 * @param groupUid
 * @return
 */
export function createTaskFromBlank(
    blank: ToDoTaskBlank,
    position?: number,
    groupUid?: string,
): ToDoTask {
    const newTask: ToDoTask = {
        ...blank,
        dateChanged: nowISO,
        dateCreated: nowISO,
        uid: generateUid(),
        position: 0,
    };

    if (position) {
        newTask.position = position;
    }

    if (groupUid) {
        newTask.groupUid = groupUid;
    }

    return newTask;
}

export function assertUniqueTitle(
    items: Array<ToDoGroup | ToDoTask>,
    title: string,
    excludeUid?: string,
) {
    const alreadyExists = _.find(
        items,
        (item: ToDoGroup | ToDoTask) =>
            item.title === title
                && (!excludeUid || (item.uid !== excludeUid)),
    );

    if (alreadyExists) {
        throw new BadRequestException([
            'Title of group/task should be unique!',
            `There are alreay exists error with id=${alreadyExists.uid}`,
        ].join('\n'));
    }
}
