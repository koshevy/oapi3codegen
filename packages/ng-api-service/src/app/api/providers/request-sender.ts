import { Subject, Subscriber } from "rxjs";

import {
    HttpErrorResponse,
    HttpEvent,
    HttpRequest
} from "@angular/common/http";

/**
 * Interface of "Sender" that do request and
 * works with attempts.
 */
export interface RequestSender<R = any, B = any> {

    /**
     * Interface of sender. Assumes, you might
     * do repeated attempts of request.
     *
     * @param {HttpRequest<B>} request
     * @param {Subscriber<R>} subscriber
     * @param {Subject<HttpEvent<R>>} statusSubject
     * @param {HttpErrorResponse} lastError
     * @param {number} remainAttemptsNumber
     */
    requestAttempt(
        request: HttpRequest<B>,
        subscriber: Subscriber<R>,
        statusSubject?: Subject<HttpEvent<R>>,
        lastError?: HttpErrorResponse,
        remainAttemptsNumber?: number
    ): void;
}
