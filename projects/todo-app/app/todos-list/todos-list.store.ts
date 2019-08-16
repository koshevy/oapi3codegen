import * as _ from 'lodash';

import { Observable, of } from 'rxjs';
import { catchError, delay, map, mergeScan, shareReplay, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';

import { tapResponse, pickResponseBody } from '@codegena/ng-api-service';
import { ToDosList } from '../api/typings';
import { GetListsService, CreateListService } from '../api/services';

import {
    Partial,
    ActionType,
    ToDosListTeaser,
    ComponentTruth,
    ComponentContext
} from './lib/context';

import {
    updateTodosListInList,
    createTodoListTeaser,
    createTodoListTeasers,
    markListAsFailedInList
} from './lib/helpers';

// ***

/**
 * Store-service for {@link TodosListComponent}.
 * Create and maintain data flow and reducing.
 *
 * Reducing is based in pure function, excepts data from API.
 * Allows only API-data prviders in DI.
 */
@Injectable()
export class TodosListStore {

    /**
     * Gives access to {@link reduceContext} as a pure function,
     * bound to this for external class.
     */
    get reduceContextFn(): (
        context: ComponentContext,
        truth: ComponentTruth
    ) => Observable<Partial<ComponentContext>> {
        return this.reduceContext.bind(this);
    }

    constructor(
        protected getListsService: GetListsService,
        protected createListService: CreateListService
    ) {}

    /**
     * Creates and returns new flow with integrated reducer,
     * described in {@link reduceContextFn}, started at `truth$`.
     */
    getNewContextFlow(
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
                        lists: createTodoListTeasers(todosLists),
                        ...truth
                    })),
                );

            case ActionType.AddNewGroupOptimistic:
            case ActionType.EditListOptimistic:

                return of({
                    ...context,
                    ...truth,
                    lists: updateTodosListInList(
                        context.lists,
                        truth.createdGroup
                    )
                });

            case ActionType.AddNewGroup:

                return this.createListService.request(_.omit(
                    truth.createdGroup,
                    'uid'
                )).pipe(
                    pickResponseBody<ToDosList>(201),
                    map<ToDosList, ComponentContext>(todosList => ({
                        ...context,
                        ...truth,
                        lists: updateTodosListInList(
                            context.lists,
                            truth.createdGroup
                        )
                    })),
                    catchError(error => {
                        return of({
                            ...context,
                            ...truth,
                            lists: markListAsFailedInList(
                                context.lists,
                                truth.createdGroup
                            )
                        }).pipe(delay(1000));
                    })
                );

            case ActionType.ChangeListPositionOptimistic:
                moveItemInArray(
                    context.lists,
                    truth.positionChanging.from,
                    truth.positionChanging.to
                );

                return of({...context, ...truth});

            case ActionType.ChangeListPosition:
                // todo describe API for ChangeList and use
                break;

            case ActionType.RemoveItemOptimistic:
                const foundListIndex = _.findIndex(
                    context.lists,
                    list => list.uid === truth.removedGroup.uid
                );

                context.lists[foundListIndex] = {
                    ...context.lists[foundListIndex],
                    failed: false,
                    optimistic: false,
                    removing: true
                };

                break;

            case ActionType.CancelOperation:
                // Was not created
                if (truth.removedGroup.uid < 0) {
                    return of({
                        ...context,
                        ...truth,
                        lists: _.reject(
                            context.lists,
                            (item: ToDosListTeaser) =>
                                item.uid === truth.removedGroup.uid
                        )
                    });
                } else {
                    // Created, by tried to change
                    return of({
                        ...context,
                        ...truth,
                        lists: updateTodosListInList(
                            context.lists,
                            truth.createdGroup,
                            false
                        )
                    });
                }

            default:
                throw new Error('Unknown action type!');
        }
    }
}
