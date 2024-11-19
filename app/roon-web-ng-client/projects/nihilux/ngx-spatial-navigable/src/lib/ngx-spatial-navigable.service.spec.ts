import { TestBed } from "@angular/core/testing";
import { NgxSpatialNavigableService } from "./ngx-spatial-navigable.service";

describe("NgxSpatialNavigableService", () => {
  let service: NgxSpatialNavigableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxSpatialNavigableService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
