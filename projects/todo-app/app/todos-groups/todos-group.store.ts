import * as _ from 'lodash';

import {
    MonoTypeOperatorFunction,
    OperatorFunction,
    Observable,
    forkJoin,
    of,
    throwError
} from 'rxjs';
import {
    catchError,
    delay,
    filter,
    map,
    mergeScan,
    shareReplay,
    takeUntil,
    tap
} from 'rxjs/operators';

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';

import { tapResponse, pickResponseBody } from '@codegena/ng-api-service';
import {
    DeleteGroupResponse,
    ToDosGroup,
    UpdateGroupResponse
} from '../api/typings';
import {
    CreateGroupService,
    DeleteGroupService,
    GetGroupsService,
    UpdateGroupService
} from '../api/services';

import {
    Partial,
    ActionType,
    ComponentTruth,
    ComponentContext, ToDosGroupTeaser
} from './lib/context';

import {
    countItemsInGroups,
    createTodoGroupTeaser,
    createTodoGroupTeasers,
    markAllAsDone,
    markGroupAsDone,
    removeGroupFromList,
    updateGroupsListItem
} from './lib/helpers';

// ***

/**
 * Store-service for {@link TodosGroupComponent}.
 * Create and maintain data flow and reducing.
 *
 * Reducing is based in pure function, excepts data from API.
 * Allows only API-data prviders in DI.
 */
@Injectable()
export class TodosGroupStore {

    constructor(
        protected getGroupsService: GetGroupsService,
        protected createGroupService: CreateGroupService,
        protected updateGroupService: UpdateGroupService,
        protected deleteGroupService: DeleteGroupService
    ) {}

    /**
     * Creates and returns new flow with integrated reducer,
     * described in {@link reduceContext}, started at {@link truth$}.
     */
    getNewContextFlow(
        truth$: Observable<ComponentTruth>
    ): Observable<ComponentContext> {
        return truth$.pipe(
            mergeScan<Partial<ComponentContext>, ComponentContext>(
                this.reduceContext.bind(this, truth$),
                {} as any as ComponentContext
            ),
            // Maps context to expand with calculated options
            map<ComponentContext, ComponentContext>(
                this.contextExtender.bind(this)
            ),
            shareReplay(1)
        );
    }

    // *** Private methods

    private reduceContext(
        truth$: Observable<ComponentTruth>,
        context: ComponentContext,
        truth: ComponentTruth
    ): Observable<Partial<ComponentContext>> {

        switch (truth.lastAction) {

            case ActionType.AddNewGroup:

                return this.createGroupService.request(_.omit(
                    truth.createdGroup,
                    'uid'
                )).pipe(
                    // Take until it get canceled
                    this.waitForActionOfGroup(
                        truth$,
                        ActionType.CancelCreation,
                        truth.createdGroup.uid
                    ),
                    pickResponseBody<ToDosGroup>(201, null, true),
                    map<ToDosGroup, ComponentContext>(group => ({
                        ...context,
                        ...truth,
                        createdGroup: group,    // rewrite by returned item with new id
                        groups: updateGroupsListItem(
                            context.groups,
                            group,
                            'clear',
                            truth.createdGroup.uid
                        )
                    })),
                    catchError(error => {
                        return of({
                            ...context,
                            ...truth,
                            groups: updateGroupsListItem(
                                context.groups,
                                truth.createdGroup,
                                'failed'
                            )
                        });
                    })
                );

            case ActionType.AddNewGroupOptimistic:

                return of({
                    ...context,
                    ...truth,
                    groups: updateGroupsListItem(
                        context.groups,
                        truth.createdGroup,
                        'optimistic'
                    )
                });

            case ActionType.CancelCreation:
                // Cancel was not created
                // todo do refactor with RemoveItem action
                return of({
                    ...context,
                    ...truth,
                    groups: removeGroupFromList(
                        context.groups,
                        truth.removedGroup.uid
                    )
                });

            case ActionType.CancelUpdating:
                // Cancel created, by tried to change
                return of({
                    ...context,
                    ...truth,
                    groups: updateGroupsListItem(
                        context.groups,
                        truth.removedGroup,
                        'failed'
                    )
                });

            case ActionType.ChangeGroupPosition:
                // todo describe API for ChangeGroup and use
                break;

            case ActionType.ChangeGroupPositionOptimistic:
                moveItemInArray(
                    context.groups,
                    truth.positionChanging.from,
                    truth.positionChanging.to
                );

                return of({...context, ...truth});

            case ActionType.EditGroup:

                return this.updateGroupService.request(
                    truth.editedGroup,
                    {
                        groupId: truth.editedGroup.uid
                    }
                ).pipe(
                    // Take until it get canceled
                    this.waitForActionOfGroup(
                        truth$,
                        ActionType.CancelUpdating,
                        truth.editedGroup.uid
                    ),
                    pickResponseBody<UpdateGroupResponse<200>>(200, null, true),
                    map<ToDosGroup, ComponentContext>(group => ({
                        ...context,
                        ...truth,
                        editedGroup: group,
                        groups: updateGroupsListItem(
                            context.groups,
                            group,
                            'clear',
                            truth.editedGroup.uid
                        )
                    })),
                    catchError(error => {
                        return of({
                            ...context,
                            ...truth,
                            groups: updateGroupsListItem(
                                context.groups,
                                truth.editedGroup,
                                'failed'
                            )
                        });
                    })
                );

            case ActionType.EditGroupOptimistic:

                return of({
                    ...context,
                    ...truth,
                    groups: updateGroupsListItem(
                        context.groups,
                        truth.editedGroup,
                        'optimistic'
                    )
                });

            case ActionType.InitializeWithRouteParams:
                const getGroupsParams = _.pick(
                    truth,
                    [
                        'isComplete',
                        'isCurrentGroup'
                    ]
                );

                // Get all groups from API
                return this.getGroupsService.request(null, getGroupsParams).pipe(
                    pickResponseBody<ToDosGroup[]>(200),
                    map<ToDosGroup[], ComponentContext>(todosGroups => ({
                        ...truth,
                        groups: createTodoGroupTeasers(todosGroups),
                        noInternetError: false
                    })),
                    this.catchConnectionLost(context)
                );

            case ActionType.MarkAllAsDone:
            case ActionType.MarkAllAsUndone:

                return forkJoin(_.map<ToDosGroupTeaser[], Observable<ToDosGroupTeaser>>(
                    context.groups,
                    (group: ToDosGroupTeaser) =>
                        this.updateGroupService.request(
                            markGroupAsDone(
                                group,
                                (truth.lastAction === ActionType.MarkAllAsDoneOptimistic)
                                    ? 'done'
                                    : 'undone',
                                true
                            ),
                            {
                                groupId: group.uid
                            }
                        ).pipe(
                            // Take until it get canceled
                            this.waitForActionOfGroup(
                                truth$,
                                ActionType.CancelUpdating,
                                group.uid
                            ),
                            pickResponseBody<UpdateGroupResponse<200>>(200, null, true),
                            map<ToDosGroup, ToDosGroupTeaser>(createTodoGroupTeaser),
                            catchError(() => of(group))
                        )
                )).pipe(map(groups =>
                    ({
                        ...context,
                        ...truth,
                        groups
                    })
                ));

                break;

            case ActionType.MarkAllAsDoneOptimistic:
            case ActionType.MarkAllAsUndoneOptimistic:

                return of({
                    ...context,
                    ...truth,
                    groups: markAllAsDone(
                        context.groups,
                        (truth.lastAction === ActionType.MarkAllAsDoneOptimistic)
                            ? 'done'
                            : 'undone',
                        true
                    )
                });

                break;

            case ActionType.MarkGroupAsDone:

                return this.updateGroupService.request(
                    markGroupAsDone(truth.editedGroup),
                    {
                        groupId: truth.editedGroup.uid
                    }
                ).pipe(
                    // Take until it get canceled
                    this.waitForActionOfGroup(
                        truth$,
                        ActionType.CancelUpdating,
                        truth.editedGroup.uid
                    ),
                    pickResponseBody<UpdateGroupResponse<200>>(200, null, true),
                    map<ToDosGroup, ComponentContext>(group => ({
                        ...context,
                        ...truth,
                        editedGroup: group,
                        groups: updateGroupsListItem(
                            context.groups,
                            group,
                            'clear',
                            truth.editedGroup.uid
                        )
                    })),
                    catchError(error => {
                        return of({
                            ...context,
                            ...truth,
                            groups: updateGroupsListItem(
                                context.groups,
                                truth.editedGroup,
                                'failed'
                            )
                        });
                    })
                );

            case ActionType.MarkGroupAsDoneOptimistic:

                return of({
                    ...context,
                    ...truth,
                    groups: updateGroupsListItem(
                        context.groups,
                        truth.editedGroup,
                        'doneOptimistic'
                    )
                });

            case ActionType.MarkGroupAsUndone:

                return this.updateGroupService.request(
                    markGroupAsDone(truth.editedGroup, 'undone'),
                    {
                        groupId: truth.editedGroup.uid
                    }
                ).pipe(
                    // Take until it get canceled
                    this.waitForActionOfGroup(
                        truth$,
                        ActionType.CancelUpdating,
                        truth.editedGroup.uid
                    ),
                    pickResponseBody<UpdateGroupResponse<200>>(200, null, true),
                    map<ToDosGroup, ComponentContext>(group => ({
                        ...context,
                        ...truth,
                        editedGroup: group,
                        groups: updateGroupsListItem(
                            context.groups,
                            group,
                            'clear',
                            truth.editedGroup.uid
                        )
                    })),
                    catchError(error => {
                        return of({
                            ...context,
                            ...truth,
                            groups: updateGroupsListItem(
                                context.groups,
                                truth.editedGroup,
                                'failed'
                            )
                        });
                    })
                );

            case ActionType.MarkGroupAsUndoneOptimistic:

                return of({
                    ...context,
                    ...truth,
                    groups: updateGroupsListItem(
                        context.groups,
                        truth.editedGroup,
                        'undoneOptimistic'
                    )
                });

            case ActionType.RemoveItem:

                return this.deleteGroupService.request(
                    null,
                    {
                        groupId: truth.removedGroup.uid
                    }
                ).pipe(
                    pickResponseBody<DeleteGroupResponse<202>>(202),
                    map((result) => {
                        // todo refactor and do usable helper function
                        return {
                            ...context,
                            ...truth,
                            groups: removeGroupFromList(
                                context.groups,
                                truth.removedGroup.uid
                            )
                        };
                    }),
                    catchError(() => of({
                        ...context,
                        ...truth
                    }))
                );

            case ActionType.RemoveItemOptimistic:

                return of({
                    ...context,
                    ...truth,
                    groups: updateGroupsListItem(
                        context.groups,
                        truth.removedGroup,
                        'removing'
                    )
                });

                break;

            default: throw new Error('Unknown action type!');
        }
    }

    /**
     * Common part of context changing thats works
     * every time at thuth changing whatever action performs.
     *
     * @param context
     * Original context
     * @return
     * Expanded context
     */
    private contextExtender(context: ComponentContext): ComponentContext {
        context.summaryGroupCount = (context.groups || []).length;
        context.summaryTaskCount = countItemsInGroups(context.groups);
        context.summaryTaskDoneCount = countItemsInGroups(context.groups, true);
        context.areAllComplete = (context.summaryTaskCount === context.summaryTaskDoneCount);
        context.areAllIncomplete = (context.summaryTaskCount === 0);
        context.isBottomPanelDisabled = _.findIndex(
            context.groups,
            (group: ToDosGroupTeaser) => group.optimistic || group.removing || group.removing
        ) !== -1;

        return context;
    }

    private waitForActionOfGroup(
        truth$: Observable<ComponentTruth>,
        actionType: ActionType,
        uid: number
    ): MonoTypeOperatorFunction<any> {
        return takeUntil(
            truth$.pipe(
                // Listens for cancel action
                filter((localTruth) =>
                    (localTruth.lastAction === actionType)
                    && (localTruth.removedGroup.uid === uid)
                )
            )
        );
    }

    private catchConnectionLost(context: ComponentContext) {
        return catchError((error: HttpErrorResponse) => {
            if (error.status === 0) {
                return of({
                    ...context,
                    noInternetError: true
                });
            } else {
                return throwError(error);
            }
        });
    }
}
