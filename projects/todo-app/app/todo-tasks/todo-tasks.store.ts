import * as _ from 'lodash';

import {
    MonoTypeOperatorFunction,
    Observable,
    forkJoin,
    of,
    throwError,
    queueScheduler
} from 'rxjs';
import {
    catchError,
    filter,
    map,
    mergeMap,
    observeOn,
    scan,
    share,
    switchMap,
    takeUntil
} from 'rxjs/operators';

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';

import { pickResponseBody } from '@codegena/ng-api-service';
import {
    ToDoGroup,
    ToDoTask,
    GetGroupsResponse,
    GetGroupItemsResponse
} from '../api/typings';
import {
    GetGroupsService,
    GetGroupItemsService
} from '../api/services';

import {
    Partial,
    ActionType,
    ComponentCalculatedData,
    ComponentTruth,
    ComponentContext,
    PositionMove,
    PositionMoveByStep,
    ToDoTaskTeaser
} from './lib/context';

import {
    addEmptyTaskAfterSelected,
    editTaskInList,
    markTaskInListAs,
    moveItemInArrayByOneStep
} from './lib/helpers';

// ***

function getDefaultState(): ComponentContext {
    return {
        $$lastAction: null,
        selectedTaskUid: null,
        totalTasksCount: 0
    };
}

// ***

/**
 * Store-service for {@link TodosGroupComponent}.
 * Create and maintain data flow and reducing.
 *
 * Reducing is based in pure function, excepts data from API.
 * Allows only API-data prviders in DI.
 */
@Injectable()
export class TodoTasksStore {

    constructor(
        protected getGroupsService: GetGroupsService,
        protected getGroupItemsService: GetGroupItemsService
    ) {}

    /**
     * Creates and returns new flow with integrated reducer,
     * described in {@link reduceContext}, started at {@link truth$}.
     */
    getNewContextFlow(
        truth$: Observable<ComponentTruth>
    ): Observable<ComponentContext> {
        return truth$.pipe(
            observeOn(queueScheduler),
            // Middleware
            mergeMap<Partial<ComponentContext>, Observable<ComponentTruth>>(
                this.middleWare.bind(this, truth$)
            ),
            // Reducer
            scan<Partial<ComponentContext>, ComponentContext>(
                this.reduceContext,
                getDefaultState()
            ),
            // Maps context to expand with calculated options
            map<ComponentContext, ComponentContext>(
                this.contextExtender.bind(this)
            ),
            share()
        );
    }

    // *** Private methods

    private middleWare(
        nextTruth$: Observable<ComponentTruth>,
        truth: ComponentTruth
    ): Observable<ComponentTruth> {
        switch (truth.$$lastAction) {
            case ActionType.InitializeWithRouteParams:

                return this.getGroupsService.request(null, {
                    isComplete: false,
                    withItems: false
                }).pipe(
                    pickResponseBody<GetGroupsResponse<200>>(200, null, true),
                    switchMap<ToDoGroup[], Observable<ComponentTruth>>((groups: ToDoGroup[]) => {
                        const selectedGroups: number[] = (truth.selectedGroups || []).length
                            ? _.intersection(groups.map(group => group.uid), truth.selectedGroups)
                            : groups.map(group => group.uid);

                        if (!selectedGroups.length) {
                            return of({
                                ...truth,
                                groups: [],
                                tasks: []
                            });
                        }

                        return forkJoin(selectedGroups.map(
                            groupId => this.getGroupItemsService.request(
                                null,
                                { groupId }
                            ).pipe(
                                pickResponseBody<GetGroupItemsResponse<200>>(
                                    200,
                                    null,
                                    true
                                )
                            )
                        )).pipe(
                            map<ToDoTask[][], ToDoTask[]>(_.flatten),
                            map<ToDoTask[], ComponentTruth>(tasks => ({
                                ...truth,
                                groups,
                                selectedGroups,
                                selectedTaskUid: _.get(tasks, '0.uid', null),
                                tasks,
                            }))
                        );
                    })
                );

            default:
                return of({...truth});
        }
    }

    private reduceContext(
        context: ComponentContext,
        truth: ComponentTruth
    ): ComponentContext {
        switch (truth.$$lastAction) {

            case ActionType.AddNewTaskOptimistic:
                return {
                    ...context,
                    ...truth,
                    selectedTaskUid: context.tasks.length
                        ? context.selectedTaskUid
                        : truth.lastAddedTask.uid,
                    tasks: [
                        ...context.tasks,
                        truth.lastAddedTask
                    ]
                };

            case ActionType.AddNewEmptyTaskAfterOptimistic:
                return {
                    ...context,
                    ...truth,
                    selectedTaskUid: truth.lastAddedTask.uid,
                    tasks: addEmptyTaskAfterSelected(
                        context.tasks,
                        context.selectedTaskUid,
                        truth.lastAddedTask
                    )
                };

            case ActionType.ChangeTaskPosition:
                // todo describe API for ChangeGroup and use
                break;

            case ActionType.ChangeTaskPositionOptimistic:

                if ([
                    PositionMoveByStep.Down,
                    PositionMoveByStep.Up
                ].includes(truth.lastTaskPositionChanging as PositionMoveByStep)) {
                    // Move by one position up or down
                    moveItemInArrayByOneStep(
                        context.tasks,
                        context.selectedTaskUid,
                        truth.lastTaskPositionChanging as PositionMoveByStep
                    );

                } else {
                    // Move from any position to other any position
                    const positionChanging = truth.lastTaskPositionChanging as PositionMove;

                    moveItemInArray(
                        context.tasks,
                        positionChanging.from,
                        positionChanging.to
                    );
                }

                return {...context, ...truth};

            case ActionType.DeleteTaskOptimistic:
                let selectedTaskAfterDelete = context.selectedTaskUid;
                let shouldSelectItemWithIndex: number;

                // change `selectedTaskUid` when it gets deleted
                if (truth.lastDeletedTaskUid === context.selectedTaskUid) {
                    shouldSelectItemWithIndex = _.findIndex(
                        context.tasks,
                        (task: ToDoTaskTeaser) => task.uid === context.selectedTaskUid
                    );

                    if (shouldSelectItemWithIndex === -1) {
                        throw new Error('Can\'t find item with selected uid in list of tasks!');
                    }

                    if (shouldSelectItemWithIndex > 0) {
                        shouldSelectItemWithIndex--;
                    } else if (context.tasks.length === 1) {
                        shouldSelectItemWithIndex = null;
                    }
                }

                const tasksAfterDeleting = _.remove(
                    context.tasks,
                    task => task.uid !== truth.lastDeletedTaskUid
                );

                if (shouldSelectItemWithIndex !== undefined) {
                    selectedTaskAfterDelete = tasksAfterDeleting[shouldSelectItemWithIndex]
                        ? tasksAfterDeleting[shouldSelectItemWithIndex].uid
                        : null;
                }

                return {
                    ...context,
                    ...truth,
                    selectedTaskUid: selectedTaskAfterDelete,
                    tasks: tasksAfterDeleting
                };

            case ActionType.EditTaskOptimistic:

                const editingTaskUid = truth.lastEditingData.uid
                    ? truth.lastEditingData.uid
                    : context.selectedTaskUid;

                return {
                    ...context,
                    ...truth,
                    selectedTaskUid: editingTaskUid,
                    tasks: editTaskInList(
                        context.tasks,
                        editingTaskUid,
                        truth.lastEditingData
                    )
                };

            case ActionType.InitializeWithDefaultState:
            case ActionType.InitializeWithRouteParams:

                return {
                    ...context,
                    ...truth
                };

            case ActionType.MarkTaskAsDoneOptimistic:
            case ActionType.MarkTaskAsUnDoneOptimistic:

                return {
                    ...context,
                    ...truth,
                    tasks: markTaskInListAs(
                        context.tasks,
                        truth.lastToggledTaskUid,
                        truth.$$lastAction === ActionType.MarkTaskAsDoneOptimistic
                    )
                };

            case ActionType.SaveChangedItems:

                return {
                    ...context,
                    ...truth
                };

            case ActionType.SelectTask:

                return {
                    ...context,
                    ...truth,
                    selectedTaskUid: truth.lastSelectedTaskUid
                };

            default: throw new Error('Unknown action type!');
        }
    }

    /**
     * Extends context with updated calculated values based
     * updated result of reducing.
     *
     * @param {ComponentContext} context
     * @return {ComponentContext}
     */
    private contextExtender(context: ComponentContext): ComponentContext {

        const calculatedData: ComponentCalculatedData = {
            totalTasksCount: (context.tasks || []).length
        };

        return _.assign(context, calculatedData);
    }
}
