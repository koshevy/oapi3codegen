import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TodosListComponent } from './todos-list/todos-list.component';

const routes: Routes = [
    {
        component: TodosListComponent,
        path: '',
        pathMatch: 'full'
    }
];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forChild(routes)]
})
export class TodoAppRoutingModule { }
