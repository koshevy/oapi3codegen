import * as _ from 'lodash';
import { GlobalPartial } from 'lodash/common/common';

import { Observable, of } from 'rxjs';
import { catchError, delay, map, mergeScan, shareReplay, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';

import { tapResponse, pickResponseBody } from '@codegena/ng-api-service';
import { ToDosList } from '../api/typings';
import { GetListsService, CreateListService } from '../api/services';

// ***

export type Partial<T> = GlobalPartial<T>;

export const enum ActionType {
    InitializeWithRouteParams = '[Initialize with route params]',
    AddNewGroupOptimistic = '[Add new group optimistic]',
    AddNewGroup = '[Add new group]',
    ChangeListPosition = '[Change list position]'
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
}

export interface ComponentTruth {
    isComplete: boolean | null;
    isCurrentList: number | null;
    createdGroup?: ToDosList;
    positionChanging?: { from: number; to: number };
    lastAction: ActionType;
}

export interface ComponentContext extends ComponentTruth {
    lists: ToDosListTeaser[];
}

// ***

@Injectable()
export class TodosListStore {

    /**
     * Gives access to {@link reduceContext} as a pure function,
     * bound to this for external class.
     */
    public get reduceContextFn(): (
        context: ComponentContext,
        truth: ComponentTruth
    ) => Observable<Partial<ComponentContext>> {
        return this.reduceContext.bind(this);
    }

    constructor(
        protected getListsService: GetListsService,
        protected createListService: CreateListService
    ) {}

    createContextFlow(
        truth$: Observable<ComponentTruth>
    ): Observable<ComponentContext> {
        return truth$.pipe(
            mergeScan<Partial<ComponentContext>, ComponentContext>(
                this.reduceContextFn,
                {} as any
            ),
            shareReplay(1)
        );
    }

    // *** Private methods

    /**
     * Reducer for this component.
     * todo move to the service.
     */
    private reduceContext(
        context: ComponentContext,
        truth: ComponentTruth
    ): Observable<Partial<ComponentContext>> {

        switch (truth.lastAction) {
            case ActionType.InitializeWithRouteParams:
                const getListsParams = _.pick(
                    truth,
                    [
                        'isComplete',
                        'isCurrentList'
                    ]
                );

                // Get all lists from API
                return this.getListsService.request(null, getListsParams).pipe(
                    pickResponseBody<ToDosList[]>(200),
                    map<ToDosList[], ComponentContext>(todosLists => ({
                        lists: _.map<ToDosList[], ToDosListTeaser>(
                            todosLists,
                            (list: ToDosList) => ({
                                ...list,
                                // fixme have copypasta
                                countOfDone: _.filter(
                                    list.items || [],
                                    ({isDone}) => isDone
                                ).length,
                                totalCount: (list.items || []).length
                            })
                        ),
                        ...truth
                    })),
                );

            case ActionType.AddNewGroupOptimistic:
                return of({
                    ...context,
                    ...truth,
                    lists: [
                        ...context.lists,
                        {
                            ...truth.createdGroup,
                            // fixme have copypasta
                            countOfDone: _.filter(
                                truth.createdGroup.items || [],
                                ({isDone}) => isDone
                            ).length,
                            optimistic: true,
                            totalCount: (truth.createdGroup.items || []).length
                        }
                    ] as ToDosListTeaser[]
                });

            case ActionType.AddNewGroup:
                return this.createListService.request(_.omit(
                    truth.createdGroup,
                    'uid'
                )).pipe(
                    pickResponseBody<ToDosList>(201),
                    map<ToDosList, ComponentContext>(todosList => {
                        const thisItemIndex = _.findIndex(
                            context.lists,
                            item => item.uid === truth.createdGroup.uid
                        );

                        if (thisItemIndex === -1) {
                            throw new Error('Cant find item with this uid');
                        }

                        // fixme prepare counts
                        context.lists[thisItemIndex] = todosList as any;

                        return {
                            ...context,
                            ...truth
                        };
                    }),
                    catchError(error => {
                        const thisItem = _.find(
                            context.lists,
                            item => item.uid === truth.createdGroup.uid
                        );

                        if (thisItem) {
                            thisItem.failed = true;
                            thisItem.optimistic = false;
                        }

                        return of({
                            ...context,
                            ...truth
                        }).pipe(delay(2000));
                    })
                );

            case ActionType.ChangeListPosition:
                moveItemInArray(
                    context.lists,
                    truth.positionChanging.from,
                    truth.positionChanging.to
                );

                return of({
                    ...context,
                    ...truth
                });

            default:
                throw new Error('Unknown action type!');
        }
    }
}
