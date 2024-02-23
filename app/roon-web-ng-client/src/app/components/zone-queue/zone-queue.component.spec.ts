import { MockBuilder, MockRender } from "ng-mocks";
import { computed, Signal, signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { QueueState } from "@model";
import { EMPTY_QUEUE_TRACK } from "@model/client";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneQueueComponent } from "./zone-queue.component";

describe("ZoneQueueComponent", () => {
  let $zoneId: WritableSignal<string>;
  let $queue: WritableSignal<QueueState>;
  let roonService: {
    queueState: jest.Mock;
  };
  let settingsService: {
    displayedZoneId: jest.Mock;
  };
  let component: ZoneQueueComponent;
  let fixture: ComponentFixture<ZoneQueueComponent>;

  beforeEach(async () => {
    $zoneId = signal("zone_id");
    $queue = signal({
      zone_id: "zone_id",
      tracks: [EMPTY_QUEUE_TRACK],
    });
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
    };
    await MockBuilder(ZoneQueueComponent)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>);

    fixture = MockRender(ZoneQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
