import { MockBuilder, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { RoonState, ZoneDescription } from "@model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { NrRootComponent } from "./nr-root.component";

describe("NrRootComponent", () => {
  let component: NrRootComponent;
  let fixture: ComponentFixture<NrRootComponent>;
  let $displayedZoneId: WritableSignal<string>;
  let $state: WritableSignal<RoonState>;
  let $zones: WritableSignal<ZoneDescription[]>;
  let roonService: {
    roonState: jest.Mock;
    zones: jest.Mock;
  };
  let settingsService: {
    displayedZonedId: jest.Mock;
  };

  beforeEach(async () => {
    $state = signal(RoonState.STARTING);
    $zones = signal(ZONES);
    roonService = {
      roonState: jest.fn().mockImplementation(() => $state),
      zones: jest.fn().mockImplementation(() => $zones),
    };
    $displayedZoneId = signal(zone_id);
    settingsService = {
      displayedZonedId: jest.fn().mockImplementation(() => $displayedZoneId),
    };
    await MockBuilder(NrRootComponent)
      .mock(RoonService, roonService as Partial<RoonService>)
      .mock(SettingsService, settingsService as Partial<SettingsService>);
    fixture = MockRender(NrRootComponent);
    component = fixture.componentInstance;
  });

  it("should create the nr-root", () => {
    expect(component).toBeTruthy();
  });
});

const zone_id = "zone_id";

const ZONES: ZoneDescription[] = [
  {
    zone_id,
    display_name: "display_name",
  },
  {
    zone_id: "other_zone_id",
    display_name: "other_display_name",
  },
];
