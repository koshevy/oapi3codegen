import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lib-todo-tasks',
  templateUrl: './todo-tasks.component.html',
  styleUrls: ['./todo-tasks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoTasksComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
