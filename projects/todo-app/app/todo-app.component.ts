import {
    Component,
    OnInit,
    ViewEncapsulation
} from '@angular/core';

import { ToasterService } from './lib/toaster.service';

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'lib-todo-app',
    styleUrls: ['./todo-app.component.scss'],
    templateUrl: './todo-app.component.html'
})
export class TodoAppComponent implements OnInit {

  constructor(
      public toaster: ToasterService
  ) { }

  ngOnInit() {
  }

}
