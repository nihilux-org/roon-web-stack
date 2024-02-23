import { mockResizeObserver } from "jsdom-testing-mocks";
import { TestBed } from "@angular/core/testing";
import { ResizeService } from "./resize.service";

describe("ResizeServiceService", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
  const mockedResizeObserver = mockResizeObserver();
  let service: ResizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResizeService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
