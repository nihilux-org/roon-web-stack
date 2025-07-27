import { MockComponent, MockProvider, ngMocks } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule, NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ZoneActionsComponent } from "@components/zone-actions/zone-actions.component";
import { ZoneCommandsComponent } from "@components/zone-commands/zone-commands.component";
import { ZoneCurrentTrackComponent } from "@components/zone-current-track/zone-current-track.component";
import { ZoneImageComponent } from "@components/zone-image/zone-image.component";
import { ZoneProgressionComponent } from "@components/zone-progression/zone-progression.component";
import { ZoneQueueComponent } from "@components/zone-queue/zone-queue.component";
import { ZoneVolumeComponent } from "@components/zone-volume/zone-volume.component";
import { DisplayMode } from "@model";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";
import { Output, Zone, ZoneState } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneContainerComponent } from "./zone-container.component";

describe("ZoneContainerComponent", () => {
  let component: ZoneContainerComponent;
  let fixture: ComponentFixture<ZoneContainerComponent>;
  let $displayedZoneId: WritableSignal<string>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $displayQueueTrack: WritableSignal<boolean>;
  let $isOneColumn: WritableSignal<boolean>;
  let $displayModeClass: WritableSignal<string>;
  let $ismSmallTablet: WritableSignal<boolean>;
  let settingsService: {
    displayedZoneId: jest.Mock;
    displayMode: jest.Mock;
    displayQueueTrack: jest.Mock;
    isOneColumn: jest.Mock;
    displayModeClass: jest.Mock;
    isSmallTablet: jest.Mock;
  };
  let $zoneState: WritableSignal<ZoneState>;
  let roonService: {
    zoneState: jest.Mock;
  };
  let spatialNavigationService: {
    resetSpatialNavigation: jest.Mock;
  };
  ngMocks.globalReplace(BrowserAnimationsModule, NoopAnimationsModule);

  beforeEach(() => {
    $displayedZoneId = signal("zone_id");
    $displayMode = signal(DisplayMode.WIDE);
    $displayQueueTrack = signal(true);
    $isOneColumn = signal(false);
    $displayModeClass = signal("wide");
    $ismSmallTablet = signal(false);
    settingsService = {
      displayedZoneId: jest.fn().mockImplementation(() => $displayedZoneId),
      displayMode: jest.fn().mockImplementation(() => $displayMode),
      displayQueueTrack: jest.fn().mockImplementation(() => $displayQueueTrack),
      isOneColumn: jest.fn().mockImplementation(() => $isOneColumn),
      displayModeClass: jest.fn().mockImplementation(() => $displayModeClass),
      isSmallTablet: jest.fn().mockImplementation(() => $ismSmallTablet),
    };
    $zoneState = signal(ZONE_STATE);
    roonService = {
      zoneState: jest.fn().mockImplementation(() => $zoneState),
    };
    spatialNavigationService = {
      resetSpatialNavigation: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        MockProvider(SettingsService, settingsService),
        MockProvider(RoonService, roonService),
        MockProvider(NgxSpatialNavigableService, spatialNavigationService),
      ],
      imports: [ZoneContainerComponent],
    }).overrideComponent(ZoneContainerComponent, {
      remove: {
        imports: [
          ZoneActionsComponent,
          ZoneCommandsComponent,
          ZoneCurrentTrackComponent,
          ZoneImageComponent,
          ZoneProgressionComponent,
          ZoneQueueComponent,
          ZoneVolumeComponent,
        ],
      },
      add: {
        imports: [
          MockComponent(ZoneActionsComponent),
          MockComponent(ZoneCommandsComponent),
          MockComponent(ZoneCurrentTrackComponent),
          MockComponent(ZoneImageComponent),
          MockComponent(ZoneProgressionComponent),
          MockComponent(ZoneQueueComponent),
          MockComponent(ZoneVolumeComponent),
        ],
      },
    });
    fixture = TestBed.createComponent(ZoneContainerComponent);
    component = fixture.componentInstance;
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
