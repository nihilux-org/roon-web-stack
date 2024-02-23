import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Subject } from "rxjs";
import { Signal, signal, WritableSignal } from "@angular/core";
import { EMPTY_TRACK, TrackDisplay } from "@model/client";
import { ResizeService } from "@services/resize.service";
import { ZoneDisplayComponent } from "./zone-display.component";

describe("ZoneDisplayComponent", () => {
  let $trackDisplay: WritableSignal<TrackDisplay>;
  let resizeObservable: Subject<ResizeObserverEntry>;
  let resizeService: {
    observeElement: jest.Mock;
  };
  let component: ZoneDisplayComponent;
  let fixture: MockedComponentFixture<ZoneDisplayComponent, { $trackDisplay: Signal<TrackDisplay> }>;

  beforeEach(async () => {
    $trackDisplay = signal(EMPTY_TRACK);
    resizeObservable = new Subject<ResizeObserverEntry>();
    resizeService = {
      observeElement: jest.fn().mockImplementation(() => resizeObservable),
    };
    await MockBuilder(ZoneDisplayComponent).mock(ResizeService, resizeService as Partial<ResizeService>);
    fixture = MockRender(ZoneDisplayComponent, {
      $trackDisplay,
    });
    component = fixture.componentInstance as ZoneDisplayComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
