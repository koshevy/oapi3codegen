import { Subject, Subscriber } from 'rxjs';

import {
    HttpErrorResponse,
    HttpEvent,
    HttpRequest
} from '@angular/common/http';

/**
 * Interface of "Sender" that do request and
 * works with attempts.
 */
export interface RequestSender<R = any, B = any> {

    /**
     * Interface of sender. Assumes, you might
     * do repeated attempts of request.
     *
     * @param request
     * @param subscriber
     * @param statusSubject
     * @param lastError
     * @param remainAttemptsNumber
     */
    requestAttempt(
        request: HttpRequest<B>,
        subscriber: Subscriber<R>,
        statusSubject?: Subject<HttpEvent<R>>,
        lastError?: HttpErrorResponse,
        remainAttemptsNumber?: number
    ): void;
}
