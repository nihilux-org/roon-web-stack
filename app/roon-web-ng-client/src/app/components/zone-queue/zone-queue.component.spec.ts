import { MockProvider } from "ng-mocks";
import { computed, Signal, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EMPTY_TRACK, TrackDisplay } from "@model";
import { QueueState } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneQueueComponent } from "./zone-queue.component";

describe("ZoneQueueComponent", () => {
  let $zoneId: WritableSignal<string>;
  let $queue: WritableSignal<QueueState>;
  let $trackDisplay: WritableSignal<TrackDisplay>;
  let $displayQueueTrack: WritableSignal<boolean>;
  let roonService: {
    queueState: jest.Mock;
  };
  let settingsService: {
    displayedZoneId: jest.Mock;
    displayQueueTrack: jest.Mock;
  };
  let component: ZoneQueueComponent;
  let fixture: ComponentFixture<ZoneQueueComponent>;

  beforeEach(() => {
    $zoneId = signal("zone_id");
    $queue = signal({
      zone_id: "zone_id",
      tracks: [],
    });
    $trackDisplay = signal(EMPTY_TRACK);
    $displayQueueTrack = signal(true);
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
    TestBed.configureTestingModule({
      imports: [ZoneQueueComponent],
      providers: [MockProvider(RoonService, roonService), MockProvider(SettingsService, settingsService)],
    });
    fixture = TestBed.createComponent(ZoneQueueComponent);
    fixture.componentRef.setInput("$trackDisplay", $trackDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
