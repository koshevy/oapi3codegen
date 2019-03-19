import { InjectionToken } from '@angular/core';

/**
 * Information about servers have to be used
 */
export interface ServersInfo {

    /**
     * List of servers base url could be used
     */
    urlWhitelist: string[];

    /**
     * Redefines of server paths
     */
    redefines?: {
        [originalUrl: string]: string
    };

    /**
     * Custom redefining of paths for particualar services.
     * Could be used in case when sublcass of {@link ApiMethodBase}
     * should work on different domain or mock server.
     */
    customRedefines?: [
        {
            /**
             * Class of service (should be subclass of {@link ApiMethodBase})
             */
            serviceClass: typeof Object.constructor,

            /**
             * Custom server path
             */
            serverUrl: string
        }
    ];
}

/**
 * Токен для внедрения  информации о серверах.
 * @type {InjectionToken<ServersData>}
 */
export const SERVERS_INFO = new InjectionToken<ServersInfo>('ServersInfo');
