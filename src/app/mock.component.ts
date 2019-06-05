import {
    ChangeDetectionStrategy,
    Component,
    OnInit
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// TODO should complete test app

enum Status {
    New = 'new',
    Pending = 'pending',
    Ready = 'ready'
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-root',
    styleUrls: ['./mock.component.css'],
    templateUrl: './mock.component.html'
})
export class MockComponent implements OnInit {
    public Status = Status;
    public title = 'Result of request to an API';

    public status$: BehaviorSubject<Status> = new BehaviorSubject(Status.New);
    // public state$: BehaviorSubject<Hero[] | null> = new BehaviorSubject(null);

    // constructor(public mockApiService: MockApiService) {}

    ngOnInit() {
        // TODO complete data flow
        // this.mockApiService.request(
        //     null,
        //     {
        //         universe: 'DC'
        //     }
        // ).subscribe(this.state$);
    }
}
