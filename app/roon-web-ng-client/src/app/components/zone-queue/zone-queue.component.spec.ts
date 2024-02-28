import { MockBuilder, MockedComponentFixture, MockedDebugElement, MockRender, ngMocks } from "ng-mocks";
import { computed, Signal, signal, WritableSignal } from "@angular/core";
import { BrowserAnimationsModule, NoopAnimationsModule } from "@angular/platform-browser/animations";
import { QueueState } from "@model";
import { EMPTY_QUEUE_TRACK, EMPTY_TRACK, TrackDisplay } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneQueueComponent } from "./zone-queue.component";

describe("ZoneQueueComponent", () => {
  let $zoneId: WritableSignal<string>;
  let $queue: WritableSignal<QueueState>;
  let $trackDisplay: WritableSignal<TrackDisplay>;
  let $displayQueueTrack: WritableSignal<boolean>;
  let $isOneColumn: WritableSignal<boolean>;
  let roonService: {
    queueState: jest.Mock;
  };
  let settingsService: {
    displayedZoneId: jest.Mock;
    displayQueueTrack: jest.Mock;
  };
  let component: MockedDebugElement<ZoneQueueComponent>;
  let fixture: MockedComponentFixture<
    ZoneQueueComponent,
    { $isOneColumn: WritableSignal<boolean>; $trackDisplay: WritableSignal<TrackDisplay> }
  >;
  ngMocks.globalReplace(BrowserAnimationsModule, NoopAnimationsModule);

  beforeEach(async () => {
    $zoneId = signal("zone_id");
    $queue = signal({
      zone_id: "zone_id",
      tracks: [],
    });
    $trackDisplay = signal(EMPTY_TRACK);
    $displayQueueTrack = signal(true);
    $isOneColumn = signal(false);
    roonService = {
      queueState: jest.fn().mockImplementation(($zoneId: Signal<string>) => {
        return computed(() => {
          const qs = $queue();
          return {
            ...qs,
            zone_id: $zoneId(),
          };
        });
      }),
    };
    settingsService = {
      displayedZoneId: jest.fn().mockImplementation(() => $zoneId),
      displayQueueTrack: jest.fn().mockImplementation(() => $displayQueueTrack),
    };
    await MockBuilder(ZoneQueueComponent)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .keep(BrowserAnimationsModule);
    fixture = MockRender(ZoneQueueComponent, {
      $isOneColumn,
      $trackDisplay,
    });
    component = fixture.point;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
