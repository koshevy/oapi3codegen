import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import {
    Answer,
    ConfirmationComponent,
    ConfirmationData
} from './confirmation.component';

@Injectable()
export class ConfirmationService {

    constructor(
        protected matBottomSheet: MatBottomSheet
    ) {}

    public confirm<T>(
        answers: Array<Answer<T>>,
        title: string = null,
        question: string = null,
    ): Observable<any> {
        return this.matBottomSheet.open<ConfirmationComponent, ConfirmationData<T>, T>(
            ConfirmationComponent,
            {
                data: {
                    answers,
                    question,
                    title
                } as ConfirmationData<T>
            }
        ).afterDismissed();
    }
}
