import { TestBed } from '@angular/core/testing';

import { Dbtask } from './dbtask';

describe('Dbtask', () => {
  let service: Dbtask;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dbtask);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
