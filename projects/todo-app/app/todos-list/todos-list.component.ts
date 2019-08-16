import * as _ from 'lodash';
import {
    merge,
    of,
    throwError,
    BehaviorSubject,
    MonoTypeOperatorFunction,
    Observable,
    Subject
} from 'rxjs';
import {
    catchError,
    distinctUntilChanged,
    delay,
    filter,
    map,
    mergeMap,
    mergeScan,
    onErrorResumeNext,
    publishReplay,
    share,
    shareReplay,
    scan,
    startWith,
    takeUntil,
    tap
} from 'rxjs/operators';

import {
  Component,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Overlay } from '@angular/cdk/overlay';

import { tapResponse, pickResponseBody } from '@codegena/ng-api-service';

import { ToDosList } from '../api/typings';
import { GetListsService, CreateListService } from '../api/services';
import { createUniqValidator } from '../lib/helpers';

import { EditGroupComponent, EditGroupConfig } from './edit-group/edit-group.component';
import {
    Partial,
    ActionType,
    ToDosListTeaser,
    ComponentTruth,
    ComponentContext
} from './lib/context';
import { TodosListStore } from './todos-list.store';

// ***

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TodosListStore],
    selector: 'lib-todos-list',
    styleUrls: ['./todos-list.component.scss'],
    templateUrl: './todos-list.component.html'
})
export class TodosListComponent implements OnInit {

    /**
     * Full context flow of component. Do changes of view
     * every emission.
     */
    context$: Observable<ComponentContext>;

    /**
     * Flow that collect all changes of values that could influence
     * to component state. Once one of that changes, this flow prepare
     * it in a common "Truth", and emits this complete "Truth".
     */
    truth$: Observable<ComponentTruth>;

    /**
     * Part of "truth": channel with manual-triggered actions and theirs data
     */
    manualActions$: Subject<Partial<ComponentTruth>> = new Subject();

    syncContext: ComponentContext;

    private tempIdCounter = -1;

    constructor(
        protected activatedRoute: ActivatedRoute,
        protected store: TodosListStore,
        protected matBottomSheet: MatBottomSheet,
        protected matSnackBar: MatSnackBar,
        protected overlay: Overlay
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
                (acc, cur) => ({ ...acc, ...cur })
            ),
            share()
        );
    }

    ngOnInit() {
        this.context$ = this.store.getNewContextFlow(this.truth$);

        this.listenEffects();
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

    listenEffects() {
        this.context$.subscribe(
            (context) => {
                // Syncing context
                this.syncContext = context;

                switch (context.lastAction) {
                    case ActionType.AddNewGroupOptimistic:
                        this.matSnackBar.open('List added to book', null, {
                            duration: 1500,
                            horizontalPosition: 'center',
                            panelClass: ['alert', 'alert-info']
                        });
                        break;

                    case ActionType.AddNewGroup:
                        const teaserOfCreatedGroup = _.find(
                            context.lists,
                            ({uid}) => uid === context.createdGroup.uid
                        );

                        if (!teaserOfCreatedGroup) {
                            throw new Error('Application logic error!');
                        }

                        if (teaserOfCreatedGroup.failed) {
                            this.matSnackBar.open('Creation failed!', 'Try again', {
                                duration: 3000,
                                horizontalPosition: 'center',
                                panelClass: ['alert', 'alert-danger']
                            }).onAction().subscribe(() => {
                                // Repeats attempt
                                this.tryAgain(context.createdGroup);
                            });
                        } else {
                            this.matSnackBar.open('Changing successful saved!', null, {
                                duration: 1500,
                                horizontalPosition: 'center',
                                panelClass: ['alert', 'alert-success']
                            });
                        }

                        break;
                }
            }
        );
    }

    // *** Events

    createGroup() {

        // Additional validator for Group Creation Form:
        // check for unique of list
        const popupConfig: EditGroupConfig = {
            customValidators: {
                title: [createUniqValidator(
                    this.syncContext.lists,
                    'title'
                )]
            }
        };

        // Open creation dialog
        const subscribtion = this.openEditGroupPopup(popupConfig)
            .subscribe((truth: Partial<ComponentTruth>) => {
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

    editGroup(list: ToDosList) {
        // Additional validator for Group Creation Form:
        // check for unique of list
        const popupConfig: EditGroupConfig = {
            customValidators: {},
            initialToDosListBlank: list
        };

        // Open creation dialog
        const subscribtion = this.openEditGroupPopup(popupConfig)
            .subscribe((truth: Partial<ComponentTruth>) => {
                this.manualActions$.next({
                    ...truth,
                    lastAction: ActionType.EditListOptimistic,
                });
                // todo do action EditList

                subscribtion.unsubscribe();
            });
    }

    listDropped(event: CdkDragDrop<ToDosListTeaser[]>) {
        this.manualActions$.next({
            lastAction: ActionType.ChangeListPositionOptimistic,
            positionChanging: {
                from: event.previousIndex,
                to: event.currentIndex
            }
        });
    }

    tryAgain(list: ToDosList) {
        this.manualActions$.next({
            createdGroup: list,
            lastAction: ActionType.AddNewGroupOptimistic
        });
        // fixme turn back (temporary disabled)
        // this.manualActions$.next({
        //     createdGroup: list,
        //     lastAction: ActionType.AddNewGroup
        // });
    }

    removeList(list: ToDosList) {
        this.manualActions$.next({
            lastAction: ActionType.RemoveItemOptimistic,
            removedGroup: list
        });
    }

    removeIncompleteList(list: ToDosList) {
        this.manualActions$.next({
            lastAction: ActionType.CancelOperation,
            removedGroup: list
        });
    }

    // *** Private methods

    private openEditGroupPopup(popupConfig: EditGroupConfig)
        : Observable<Partial<ComponentTruth>> {

        return this.matBottomSheet.open<
            EditGroupComponent,
            EditGroupConfig,
            ToDosList
        >(EditGroupComponent, {
            data: popupConfig,
            scrollStrategy: this.overlay.scrollStrategies.reposition()
        })  .afterDismissed() // Waiting for result
            .pipe(
                filter(v => !!v),
                // takeUntil(),
                map<ToDosList, Partial<ComponentTruth>>((newList) => ({
                    createdGroup: _.assign(
                        newList,
                        // Adds temporary ID if not set
                        { uid: newList.uid || this.getTempId() }
                    )
                }))
            );
    }

    /**
     * Returns new temporary ID for optimistic added items.
     */
    private getTempId(): number {
        return this.tempIdCounter--;
    }
}
