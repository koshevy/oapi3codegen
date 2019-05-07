/**
 * Prepares environment for tests.
 * TypeScript —> Node.js file.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as _lodash from 'lodash';

/* tslint:disable no-implicit-dependencies */
import {
    createApiServiceWithTemplate,
    ApiServiceTemplateData
} from '../projects/ng-api-service/src/lib/templates';

// Mock data for tests
import { MockApiService } from './app/mock-api/mock-template.data';

const _ = _lodash;
declare const RegExp;

// Before tests: initialize mock services
const mockApiTemplate = createApiServiceWithTemplate(
    MockApiService as ApiServiceTemplateData
) as any;

fs.writeFileSync(
    path.resolve(__dirname, '../../app/mock-api/dist/mock.api.service.ts'),
    mockApiTemplate
);
