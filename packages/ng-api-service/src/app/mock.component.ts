import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

enum State {
  New = 'new',
  Pending = 'pending',
  Ready = 'ready'
}

@Component({
  selector: 'app-root',
  templateUrl: './mock.component.html',
  styleUrls: ['./mock.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MockComponent {
  public State = State;
  public title = 'Result of request to an API';

  public state$: BehaviorSubject<State> = new BehaviorSubject(State.New);
  public dataFromApi$: BehaviorSubject<any> = new BehaviorSubject(null);
}
