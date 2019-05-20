import { TestBed } from '@angular/core/testing';

import { Oapi3tsCliService } from './oapi3ts-cli.service';

describe('Oapi3tsCliService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Oapi3tsCliService = TestBed.get(Oapi3tsCliService);
    expect(service).toBeTruthy();
  });
});
