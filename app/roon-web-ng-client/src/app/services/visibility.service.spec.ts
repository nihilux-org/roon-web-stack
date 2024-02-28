import { TestBed } from "@angular/core/testing";
import { VisibilityService } from "@services/visibility.service";

describe("VisibilityService", () => {
  let service: VisibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisibilityService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
