import * as _ from 'lodash';
import {
    merge,
    Observable,
    Subject
} from 'rxjs';
import {
    distinctUntilChanged,
    filter,
    map,
    share,
    scan,
    timeout
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

import { ToDosGroup } from '../api/typings';
import { createUniqValidator } from '../lib/helpers';

import { EditGroupComponent, EditGroupConfig } from './edit-group/edit-group.component';
import {
    Partial,
    ActionType,
    ToDosGroupTeaser,
    ComponentTruth,
    ComponentContext
} from './lib/context';
import { TodosGroupStore } from './todos-group.store';
import { ConfirmationService } from '../confirmation/confirmation.service';

// ***

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TodosGroupStore],
    selector: 'lib-todos-group',
    styleUrls: ['./todos-group.component.scss'],
    templateUrl: './todos-group.component.html'
})
export class TodosGroupComponent implements OnInit {

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

    /**
     * Last emitted value in {@link context$},
     * saved by subscriber in {@link listenEffects}.
     */
    syncContext: ComponentContext;

    private tempIdCounter = -1;

    constructor(
        protected activatedRoute: ActivatedRoute,
        protected matBottomSheet: MatBottomSheet,
        protected matSnackBar: MatSnackBar,
        protected overlay: Overlay,
        protected confirmationService: ConfirmationService,
        protected store: TodosGroupStore,
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
            map<any, ComponentTruth>(({isComplete, isCurrentGroup}) => {
                return {
                    isComplete: isComplete || null,
                    isCurrentGroup: isCurrentGroup || null,
                    lastAction: ActionType.InitializeWithRouteParams
                };
            })
        );
    }

    listenEffects() {
        this.context$.subscribe((context: ComponentContext) => {
            // Syncing context
            this.syncContext = context;

            switch (context.lastAction) {
                case ActionType.AddNewGroupOptimistic:
                    this.matSnackBar.open('Group are saving...', null, {
                        duration: 1000,
                        panelClass: ['alert', 'alert-info']
                    });
                    break;

                case ActionType.AddNewGroup:
                    const teaserOfCreatedGroup = _.find(
                        context.groups,
                        ({uid}) => uid === context.createdGroup.uid
                    );

                    if (!teaserOfCreatedGroup) {
                        throw new Error('Application logic error!');
                    }

                    if (teaserOfCreatedGroup.failed) {
                        this.matSnackBar.open('Creation failed!', 'Remove', {
                            duration: 3000,
                            panelClass: ['alert', 'alert-danger']
                        }).onAction().subscribe(() => {
                            // Repeats attempt
                            this.removeIncompleteGroup(context.createdGroup);
                        });
                    } else {
                        this.matSnackBar.open('Changing successful saved!', null, {
                            duration: 1500,
                            panelClass: ['alert', 'alert-success']
                        });
                    }

                    break;
            }
        });
    }

    // *** Events

    createGroup() {

        // Additional validator for Group Creation Form:
        // check for unique of group
        const popupConfig: EditGroupConfig = {
            customValidators: {
                title: [createUniqValidator(
                    this.syncContext.groups,
                    'title'
                )]
            }
        };

        // Open creation dialog
        const subscribtion = this.openEditGroupPopup(popupConfig)
            .subscribe((group: ToDosGroup) => {
                // Optimistic adding of item (before sending to server)
                this.manualActions$.next({
                    createdGroup: group,
                    lastAction: ActionType.AddNewGroupOptimistic
                });
                // Sending to server
                this.manualActions$.next({
                    createdGroup: group,
                    lastAction: ActionType.AddNewGroup
                });

                subscribtion.unsubscribe();
            });
    }

    editGroup(group: ToDosGroup) {
        // Additional validator for Group Creation Form:
        // check for unique of group
        const popupConfig: EditGroupConfig = {
            customValidators: {},
            initialToDosGroupBlank: group
        };

        // Open creation dialog
        const subscribtion = this.openEditGroupPopup(popupConfig)
            .subscribe((todoGroup: ToDosGroup) => {
                this.manualActions$.next({
                    editedGroup: todoGroup,
                    lastAction: ActionType.EditGroupOptimistic,
                });
                this.manualActions$.next({
                    editedGroup: todoGroup,
                    lastAction: ActionType.EditGroup,
                });

                subscribtion.unsubscribe();
            });
    }

    groupDropped(event: CdkDragDrop<ToDosGroupTeaser[]>) {
        this.manualActions$.next({
            groups: this.syncContext.groups,
            lastAction: ActionType.ChangeGroupPositionOptimistic,
            positionChanging: {
                from: event.previousIndex,
                to: event.currentIndex
            }
        });
    }

    markAllAsDone() {
        if (this.syncContext.areAllComplete) {
            return;
        }

        this.manualActions$.next({
            groups: this.syncContext.groups,
            lastAction: ActionType.MarkAllAsDoneOptimistic
        });
        this.manualActions$.next({
            groups: this.syncContext.groups,
            lastAction: ActionType.MarkAllAsDone
        });
    }

    markAllAsUndone() {
        if (this.syncContext.areAllIncomplete) {
            return;
        }

        this.manualActions$.next({
            groups: this.syncContext.groups,
            lastAction: ActionType.MarkAllAsUndoneOptimistic
        });
        this.manualActions$.next({
            groups: this.syncContext.groups,
            lastAction: ActionType.MarkAllAsUndone
        });
    }

    markGroupAsDone(group: ToDosGroup) {
        this.manualActions$.next({
            editedGroup: group,
            lastAction: ActionType.MarkGroupAsDoneOptimistic
        });
        this.manualActions$.next({
            editedGroup: group,
            lastAction: ActionType.MarkGroupAsDone
        });
    }

    markGroupAsUndone(group: ToDosGroup) {
        this.manualActions$.next({
            editedGroup: group,
            lastAction: ActionType.MarkGroupAsUndoneOptimistic
        });
        this.manualActions$.next({
            editedGroup: group,
            lastAction: ActionType.MarkGroupAsUndone
        });
    }

    removeGroup(group: ToDosGroup) {
        this.confirmationService.confirm(
            [
                {
                    text: 'Remove group and all tasks. This action would not be canceled!',
                    title: 'Delete',
                    value: true
                },
                {
                    text: 'Keep group and tasks',
                    title: 'Cancel',
                    value: false,
                }
            ]
        )   .pipe(
                filter(result => !!result),
                // Hide dialog after 10 seconds of idle if no answer
                timeout(10000),
            )
            .subscribe((result: boolean) => {
                this.manualActions$.next({
                    lastAction: ActionType.RemoveItemOptimistic,
                    removedGroup: group
                });
                this.manualActions$.next({
                    lastAction: ActionType.RemoveItem,
                    removedGroup: group
                });
            });
    }

    removeIncompleteGroup(group: ToDosGroup) {
        const actionType = group.uid < 0
            ? ActionType.CancelCreation
            : ActionType.CancelUpdating;

        this.manualActions$.next({
            lastAction: actionType,
            removedGroup: group
        });
    }

    tryAgainUpdate(group: ToDosGroup) {
        this.manualActions$.next({
            createdGroup: group,
            lastAction: ActionType.AddNewGroupOptimistic
        });
        this.manualActions$.next({
            createdGroup: group,
            lastAction: ActionType.AddNewGroup
        });
    }

    // *** Private methods

    private openEditGroupPopup(popupConfig: EditGroupConfig)
        : Observable<ToDosGroup> {

        return this.matBottomSheet.open<
            EditGroupComponent,
            EditGroupConfig,
            ToDosGroup
        >(EditGroupComponent, {
            data: popupConfig,
            scrollStrategy: this.overlay.scrollStrategies.reposition()
        })  .afterDismissed() // Waiting for result
            .pipe(
                filter(v => !!v),
                // takeUntil(),
                map((newGroup: ToDosGroup) => ({
                    ...newGroup,
                        // Adds temporary ID if not set
                    uid: newGroup.uid || this.getTempId()
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
