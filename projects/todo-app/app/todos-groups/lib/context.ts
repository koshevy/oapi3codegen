import { ToDosGroup } from '../../api/typings';
import { GlobalPartial } from 'lodash/common/common';

export type Partial<T> = GlobalPartial<T>;

export const enum ActionType {
    AddNewGroup = '[Add new group]',
    AddNewGroupOptimistic = '[Add new group (optimistic)]',
    ClearAllDone = '[Clear all done tasks]',
    CancelCreation = '[Cancel creation]',
    CancelUpdating = '[Cancel updating]',
    ChangeGroupPosition = '[Change group position]',
    ChangeGroupPositionOptimistic = '[Change group position (optimistic)]',
    EditGroup = '[Edit group]',
    EditGroupOptimistic = '[Edit group (optimistic)]',
    InitializeWithRouteParams = '[Initialize with route params]',
    MarkAllAsDone = '[Mark group items as done]',
    MarkAllAsDoneOptimistic = '[Mark group items as done (optimistic)]',
    MarkAllAsUndone = '[Mark group items as undone]',
    MarkAllAsUndoneOptimistic = '[Mark group items as undone (optimistic)]',
    MarkGroupAsDone = '[Mark group items as undone]',
    MarkGroupAsDoneOptimistic = '[Mark group items as done (optimistic)]',
    MarkGroupAsUndone = '[Mark group items as undone]',
    MarkGroupAsUndoneOptimistic = '[Mark group items as undone (optimistic)]',
    RemoveItem = '[Remove item]',
    RemoveItemOptimistic = '[Remove item (optimistic)]'
}

/**
 * Teaser of ToDos group in common group of this component.
 * Shows both of already created and new optimistically added,
 * but not created yet in fact.
 */
export interface ToDosGroupTeaser extends ToDosGroup {
    countOfDone: number;
    totalCount: number;
    /**
     * Marks this item added to groups optimistically.
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
    isCurrentGroup: number | null;
    createdGroup?: ToDosGroup;
    editedGroup?: ToDosGroup;
    removedGroup?: ToDosGroup;
    positionChanging?: { from: number; to: number };
    lastAction: ActionType;
}

export interface ComponentContext extends ComponentTruth {
    areAllComplete?: boolean;
    areAllIncomplete?: boolean;

    groups?: ToDosGroupTeaser[];

    /**
     * Bottom panel should be disabled when some processes are going.
     */
    isBottomPanelDisabled?: boolean;

    /**
     * Mark component as not initialized, because no internet
     */
    noInternetError?: boolean;

    summaryTaskCount?: number;
    summaryTaskDoneCount?: number;
    summaryGroupCount?: number;
}