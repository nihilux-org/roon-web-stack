import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TestBed } from "@angular/core/testing";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";

describe("NgxSpatialNavigableService", () => {
  let service: NgxSpatialNavigableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxSpatialNavigableService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
