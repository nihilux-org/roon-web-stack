import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Subject } from "rxjs";
import { signal, WritableSignal } from "@angular/core";
import { Output, Zone, ZoneState } from "@model";
import { DisplayMode } from "@model/client";
import { ResizeService } from "@services/resize.service";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneContainerComponent } from "./zone-container.component";

describe("ZoneContainerComponent", () => {
  let component: ZoneContainerComponent;
  let fixture: MockedComponentFixture<ZoneContainerComponent>;
  let $displayedZoneId: WritableSignal<string>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $displayQueueTrack: WritableSignal<boolean>;
  let $isOneColumn: WritableSignal<boolean>;
  let settingsService: {
    displayedZoneId: jest.Mock;
    displayMode: jest.Mock;
    displayQueueTrack: jest.Mock;
    isOneColumn: jest.Mock;
  };
  let $zoneState: WritableSignal<ZoneState>;
  let roonService: {
    zoneState: jest.Mock;
  };
  let resizeObservable: Subject<ResizeObserverEntry>;
  let resizeService: {
    observeElement: jest.Mock;
  };

  beforeEach(async () => {
    $displayedZoneId = signal("zone_id");
    $displayMode = signal(DisplayMode.WIDE);
    $displayQueueTrack = signal(true);
    $isOneColumn = signal(false);
    settingsService = {
      displayedZoneId: jest.fn().mockImplementation(() => $displayedZoneId),
      displayMode: jest.fn().mockImplementation(() => $displayMode),
      displayQueueTrack: jest.fn().mockImplementation(() => $displayQueueTrack),
      isOneColumn: jest.fn().mockImplementation(() => $isOneColumn),
    };
    $zoneState = signal(ZONE_STATE);
    roonService = {
      zoneState: jest.fn().mockImplementation(() => $zoneState),
    };
    resizeObservable = new Subject<ResizeObserverEntry>();
    resizeService = {
      observeElement: jest.fn().mockImplementation(() => resizeObservable),
    };
    await MockBuilder(ZoneContainerComponent)
      .mock(SettingsService, settingsService as Partial<SettingsService>)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(ResizeService, resizeService as Partial<ResizeService>);
    fixture = MockRender(ZoneContainerComponent);
    component = fixture.componentInstance as ZoneContainerComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

const OUTPUT: Output = {
  zone_id: "zone_id",
  display_name: "display_name_output",
  output_id: "output_id",
  state: "paused",
  can_group_with_output_ids: ["first_id", "second_id"],
  source_controls: [
    {
      control_key: "control_key",
      display_name: "display_name_source_control",
      status: "selected",
      supports_standby: true,
    },
  ],
  volume: {
    max: 4242,
    min: 42,
    step: 4,
    value: 420,
    type: "number",
    is_muted: false,
  },
};

const ZONE: Zone = {
  zone_id: "zone_id",
  display_name: "display_name",
  state: "paused",
  outputs: [
    OUTPUT,
    {
      ...OUTPUT,
      output_id: OUTPUT.output_id + "_other",
    },
  ],
  is_next_allowed: true,
  is_play_allowed: true,
  is_previous_allowed: true,
  is_seek_allowed: true,
  is_pause_allowed: true,
  seek_position: 42,
  queue_items_remaining: 420,
  queue_time_remaining: 4242,
  settings: {
    loop: "disabled",
    shuffle: false,
    auto_radio: true,
  },
  now_playing: {
    length: 42,
    image_key: "image_key",
    one_line: {
      line1: "line1",
    },
    two_line: {
      line1: "line1",
      line2: "line2",
    },
    three_line: {
      line1: "line1",
      line2: "line2",
      line3: "line3",
    },
    seek_position: 4,
  },
};

const ZONE_STATE: ZoneState = {
  ...ZONE,
  nice_playing: {
    state: ZONE.state,
    nb_items_in_queue: ZONE.queue_items_remaining,
    total_queue_remaining_time: "42",
    track: {
      title: ZONE.now_playing?.three_line.line1 ?? "",
      length: `${ZONE.now_playing?.length}`,
      image_key: ZONE.now_playing?.image_key ?? "",
      artist: ZONE.now_playing?.three_line.line2 ?? "",
      seek_position: `${ZONE.now_playing?.seek_position}`,
      seek_percentage: 42,
      disk: {
        title: ZONE.now_playing?.three_line.line3 ?? "",
        artist: ZONE.now_playing?.three_line.line2 ?? "",
        image_key: ZONE.now_playing?.image_key ?? "",
      },
    },
  },
};
