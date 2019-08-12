import * as _ from 'lodash';
import { GlobalPartial } from 'lodash/common/common';
import {
    merge,
    of,
    BehaviorSubject,
    Observable,
    Subject
} from 'rxjs';
import {
    catchError,
    distinctUntilChanged,
    filter,
    map,
    mergeMap,
    mergeScan,
    publishReplay,
    share,
    shareReplay,
    scan,
    takeUntil,
    tap
} from 'rxjs/operators';

import {
  Component,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { tapResponse, pickResponseBody } from '@codegena/ng-api-service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { ToDosList } from '../api/typings';
import { GetListsService, CreateListService } from '../api/services';

import { EditGroupComponent } from './edit-group/edit-group.component';

// ***

type Partial<T> = GlobalPartial<T>;

const enum ActionType {
    InitializeWithRouteParams = '[Initialize with route params]',
    AddNewGroupOptimistic = '[Add new group optimistic]',
    AddNewGroup = '[Add new group]'
}

/**
 * Teaser of ToDos list in common list of this component.
 * Shows both of already created and new optimistically added,
 * but not created yet in fact.
 */
interface ToDosListTeaser extends ToDosList {
    /**
     * Marks this item added to lists optimistically.
     */
    optimistic?: boolean;

    /**
     * Marks this item was failed during adding
     */
    failed?: boolean;
}

interface ComponentTruth {
    isComplete: boolean | null;
    isCurrentList: number | null;
    createdGroup?: ToDosList;
    lastAction: ActionType;
}

interface ComponentContext extends ComponentTruth {
    lists: ToDosListTeaser[];
}

// ***

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lib-todos-list',
  styleUrls: ['./todos-list.component.scss'],
  templateUrl: './todos-list.component.html'
})
export class TodosListComponent implements OnInit {

    truth$: Observable<ComponentTruth>;
    context$: Observable<ToDosListTeaser[]>;
    manualActions$: Subject<Partial<ComponentTruth>> = new Subject();

    private tempIdCounter = -1;

    constructor(
        public activatedRoute: ActivatedRoute,
        protected getListsService: GetListsService,
        protected createListService: CreateListService,
        protected matBottomSheet: MatBottomSheet
    ) {
        /**
         * Merge sources of truth
         */
        this.truth$ = merge(
            // From route
            this.getTruthFromRouteParams(),
            // Actions, dispatched manually
            this.manualActions$
        ).pipe(
            // And transform to complete truth
            scan<Partial<ComponentTruth>, ComponentTruth>(
                (acc: ComponentTruth, cur: Partial<ComponentTruth>) => {
                    return _.assign(acc, cur);
                }
            )
        );
    }

    ngOnInit() {
        this.context$ = this.truth$.pipe(
            mergeScan(this.reduceContext.bind(this), {}),
            shareReplay(1)
        ) as any;
    }

    getTruthFromRouteParams(): Observable<ComponentTruth> {
        return this.activatedRoute.queryParams.pipe(
            distinctUntilChanged(_.isEqual),
            map<any, ComponentTruth>(({isComplete, isCurrentList}) => {
                return {
                    isComplete: isComplete || null,
                    isCurrentList: isCurrentList || null,
                    lastAction: ActionType.InitializeWithRouteParams
                };
            })
        );
    }

    /**
     * Reducer for this component.
     * todo move to the service.
     */
    reduceContext(
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
                        lists: todosLists,
                        ...truth
                    })),
                );
            case ActionType.AddNewGroupOptimistic:

                _.assign(context, {
                    lists: [
                        ...context.lists,
                        {
                            ...truth.createdGroup,
                            optimistic: true
                        }
                    ] as ToDosListTeaser[]
                });

                return of(context);

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

                        context.lists[thisItemIndex] = todosList;

                        return context;
                    }),
                    catchError(error => {
                        console.error(error);

                        const thisItem = _.find(
                            context.lists,
                            item => item.uid === truth.createdGroup.uid
                        );

                        if (thisItem) {
                            thisItem.failed = true;
                            thisItem.optimistic = false;
                        }

                        return of(context);
                    })
                );

            default:
                throw new Error('Unknown action type!');
        }
    }

    // ***

    openCreateGroupPopup() {
        // Open creation dialog
        const subscribtion =  this.matBottomSheet.open<
            EditGroupComponent,
            any,
            ToDosList
        >(EditGroupComponent)
            // Waiting for result
            .afterDismissed()
            .pipe(
                filter(v => !!v),
                // takeUntil(),
                map<ToDosList, Partial<ComponentTruth>>((newList) => ({
                    createdGroup: _.assign(
                        newList,
                        // Adds temporary ID
                        { uid: this.getTempId() }
                    )
                }))
            ).subscribe((truth: Partial<ComponentTruth>) => {
                // Optimistic adding of item (before sending to server)
                this.manualActions$.next({
                    ...truth,
                    lastAction: ActionType.AddNewGroupOptimistic
                });
                // Sending to server
                this.manualActions$.next({
                    ...truth,
                    lastAction: ActionType.AddNewGroup
                });

                subscribtion.unsubscribe();
            });
    }

    /**
     * Returns new temporary ID for optimistic added items.
     * @return {number}
     */
    private getTempId(): number {
        return this.tempIdCounter--;
    }
}
