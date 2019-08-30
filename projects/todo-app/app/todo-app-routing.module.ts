import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TodosGroupComponent } from './todos-groups/todos-group.component';

const routes: Routes = [
    {
        component: TodosGroupComponent,
        path: '',
        pathMatch: 'full'
    }
];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forChild(routes)]
})
export class TodoAppRoutingModule { }
