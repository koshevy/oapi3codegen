import { ToDosList } from '../../api/typings';
import { GlobalPartial } from 'lodash/common/common';

export type Partial<T> = GlobalPartial<T>;

export const enum ActionType {
    AddNewGroupOptimistic = '[Add new group optimistic]',
    AddNewGroup = '[Add new group]',
    CancelOperation = '[Cancel operation]',
    ChangeListPositionOptimistic = '[Change list position optimistic]',
    ChangeListPosition = '[Change list position]',
    EditListOptimistic = '[Edit list optimistic]',
    InitializeWithRouteParams = '[Initialize with route params]',
    RemoveItemOptimistic = '[Remove item optimistic]',
    RemoveItem = '[Remove item]'
}

/**
 * Teaser of ToDos list in common list of this component.
 * Shows both of already created and new optimistically added,
 * but not created yet in fact.
 */
export interface ToDosListTeaser extends ToDosList {
    countOfDone: number;
    totalCount: number;
    /**
     * Marks this item added to lists optimistically.
     */
    optimistic?: boolean;

    /**
     * Marks this item was failed during adding
     */
    failed?: boolean;

    /**
     * Marks this item have been removing
     */
    removing?: boolean;
}

export interface ComponentTruth {
    isComplete: boolean | null;
    isCurrentList: number | null;
    createdGroup?: ToDosList;
    removedGroup?: ToDosList;
    positionChanging?: { from: number; to: number };
    lastAction: ActionType;
}

export interface ComponentContext extends ComponentTruth {
    lists: ToDosListTeaser[];
}