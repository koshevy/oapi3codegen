import * as _ from 'lodash';
import { GlobalPartial } from 'lodash/common/common';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { ToDosListBlank, ToDosItemBlank } from '../../api/typings';
import { schema } from '../../api/services';
import { JsonValidationService } from '../../lib/json-validation.service';

// ***

type Partial<T> = GlobalPartial<T>;

interface ComponentTruth {
    /**
     * Raw form data as a source
     */
    formData: {
        description: string;
        title: string;
        tasksText: string;
    };

    isFormDataValid: boolean;
}

interface ComponentContext extends ComponentTruth {

    /**
     * Complete {@link ToDosListBlank} data based on
     * {@link ComponentContext.formData}
     */
    completeToDosListBlank?: ToDosListBlank | null;

    saveEnabled: boolean;
}

// ***

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'lib-edit-group',
    styleUrls: ['./edit-group.component.scss'],
    templateUrl: './edit-group.component.html'
})
export class EditGroupComponent implements OnInit {

    /**
     * Messages to be merged with `#/components.schemas.ToDosListBlank`
     * in a {@link schema} in {@link getFormJsonSchemaWithMessages}.
     *
     * Format of this messages supported in {@link https://www.npmjs.com/package/ajv}
     */
    public errorMessages = {
        description: {
            errorMessage: {
                maxLenth: 'Description should be understandable, but not redundant',
                minLength: 'Please, set description in one/two sequences',
                type: 'Description of task group helps you to understand intention of that'
            }
        },
        title: {
            errorMessage: {
                maxLenth: 'Title should\'t be long',
                minLength: 'Name should\'t be so short',
                type: 'Name of task group is required'
            }
        }
    };

    public truth$: Observable<Partial<ComponentTruth>>;
    public context$: Observable<ComponentContext>;

    public formGroup: FormGroup;

    constructor(
        protected matBottomSheetRef: MatBottomSheetRef
    ) {
        const validatorFactory = new JsonValidationService();
        const createValidator = validatorFactory.createValidator.bind(
            validatorFactory
        );

        validatorFactory.setScheme(
            this.getFormJsonSchemaWithMessages()
        );

        this.formGroup = new FormGroup({
            description: new FormControl(null, createValidator('description')),
            tasksText: new FormControl(null),
            title: new FormControl(null, createValidator('title'))
        });
    }

    ngOnInit() {
        this.initTruth();
        this.initContext();
    }

    initTruth() {
        /**
         * Local source of truth — is a two parts of it:
         * FormData and validity status.
         */
        type ComponentContextTruthSrc = [
            Partial<ComponentTruth>,
            Partial<ComponentTruth>
        ];

        // Listening sources of thruth
        this.truth$ = combineLatest([
            this.formGroup.valueChanges.pipe(
                map(formData => ({formData}))
            ),
            this.formGroup.statusChanges.pipe(
                distinctUntilChanged(),
                map((status: 'VALID' | any) =>
                    ({isFormDataValid: status === 'VALID'})
                )
            )
        ]).pipe(
            // And transform to complete truth
            map<
                ComponentContextTruthSrc,
                ComponentTruth
                >(([{formData}, {isFormDataValid}]) => {
                return {
                    formData,
                    isFormDataValid
                };
            }),
            startWith({
                formData: this.formGroup.value,
                isFormDataValid: this.formGroup.status === 'VALID'
            })
        );
    }

    initContext() {
        this.context$ = this.truth$.pipe(
            map((truth: ComponentTruth) => {
                let completeToDosListBlank: ToDosListBlank | null;
                let saveEnabled: boolean;

                if (truth.isFormDataValid) {
                    const { tasksText } = truth.formData;
                    const items = _.map<string, ToDosItemBlank>(
                        (tasksText || '').split('\n'),
                        (srcLine) => ({
                            description: null,
                            isDone: false,
                            listUid: 0,
                            title: srcLine
                        })
                    );

                    completeToDosListBlank = {
                        description: truth.formData.description,
                        items,
                        title: truth.formData.title
                    }
                    saveEnabled = true;
                } else {
                    completeToDosListBlank = null;
                    saveEnabled = false;
                }

                return {
                    ...truth,
                    completeToDosListBlank,
                    saveEnabled
                };
            })
        );
    }

    /**
     * Make complete schema for validation data of {@link formGroup}.
     *
     * Gets needed sub-schema from {@link schema} (`#/components.schemas.ToDosListBlank`),
     * and merge with {@link errorMessages}.
     */
    getFormJsonSchemaWithMessages(): object {
        const schemaWithoutMessages = {
            ...schema.components.schemas.ToDosListBlank,
            components: schema.components,
        };

        return _.merge(schemaWithoutMessages, {
            properties: {
                ...this.errorMessages
            }
        });
    }

    cancel() {
        this.matBottomSheetRef.dismiss();
    }
}
