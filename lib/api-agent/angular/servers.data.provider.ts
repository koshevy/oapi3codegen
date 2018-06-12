import { InjectionToken } from '@angular/core';

/**
 * Информация о серверах, где ключ — оригинальный путь (без
 * завершающего слэша), а значение — подменяющий его.
 */
export interface ServersData {
    [originalPath: string]: string;
}

/**
 * Токен для внедрения  информации о серверах.
 * @type {InjectionToken<ServersData>}
 */
export const SERVERS_DATA = new InjectionToken<ServersData>('ServersData');

