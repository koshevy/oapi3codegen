import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Oapi3tsCliComponent } from './oapi3ts-cli.component';

describe('Oapi3tsCliComponent', () => {
  let component: Oapi3tsCliComponent;
  let fixture: ComponentFixture<Oapi3tsCliComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Oapi3tsCliComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Oapi3tsCliComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
