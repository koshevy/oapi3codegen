import * as _ from 'lodash';

import { ToDosList } from '../../api/typings';
import { ToDosListTeaser } from './context';

export function createTodoListTeaser(srcList: ToDosList): ToDosListTeaser {
    return {
        ...srcList,
        countOfDone: _.filter(
            srcList.items || [],
        ({isDone}) => isDone
        ).length,
        totalCount: (srcList.items || []).length
    };
}

export function createTodoListTeasers(srcLists: ToDosList[]): ToDosListTeaser[] {
    return _.map(srcLists, createTodoListTeaser);
}

export function updateTodosListInList(
    srcLists: ToDosListTeaser[],
    updatedItem: ToDosList,
    isOptimistic: boolean = true
): ToDosListTeaser[] {

    // It may be an already added list when user
    // had clicked "Try again"
    const alreadyAddedIndex = _.findIndex(
        srcLists,
        list => list.uid === updatedItem.uid
    );

    // Returns copy of already existed or create new optimistic item
    const optimisticTeaser = {
        ...createTodoListTeaser(updatedItem),
        failed: false,
        optimistic: isOptimistic
    };

    if (alreadyAddedIndex !== -1) {
        srcLists[alreadyAddedIndex] = optimisticTeaser;
    } else {
        srcLists.push(optimisticTeaser);
    }

    // return copy of an array
    return [...srcLists];
}

export function markListAsFailedInList(
    srcLists: ToDosListTeaser[],
    updatedItem: ToDosList
): ToDosListTeaser[] {
    // It may be an already added list when user
    // had clicked "Try again"
    const alreadyAddedIndex = _.findIndex(
        srcLists,
        list => list.uid === updatedItem.uid
    );

    if (alreadyAddedIndex === -1) {
        throw new Error(`Can't find list with id ${updatedItem.uid}!`);
    }

    srcLists[alreadyAddedIndex] = {
        ...srcLists[alreadyAddedIndex],
        failed: true
    };

    // return copy of an array
    return [...srcLists];
}
