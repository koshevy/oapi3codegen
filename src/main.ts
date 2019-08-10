import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { TodoAppModule } from '@codegena/todo-app/app';
// import { TodoAppModule } from '../projects/todo-app/src/todo-app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(TodoAppModule)
  .catch(err => console.error(err));
