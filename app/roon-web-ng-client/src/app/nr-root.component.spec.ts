import { MockProvider } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ApiState, RoonState } from "@model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { NrRootComponent } from "./nr-root.component";

describe("NrRootComponent", () => {
  let component: NrRootComponent;
  let fixture: ComponentFixture<NrRootComponent>;
  let $displayedZoneId: WritableSignal<string>;
  let $state: WritableSignal<ApiState>;
  let $isGrouping: WritableSignal<boolean>;
  let roonService: {
    roonState: jest.Mock;
    isGrouping: jest.Mock;
  };
  let settingsService: {
    displayedZonedId: jest.Mock;
  };

  beforeEach(() => {
    $state = signal({
      state: RoonState.STARTING,
      zones: [],
      outputs: [],
    });
    $isGrouping = signal(false);
    roonService = {
      roonState: jest.fn().mockImplementation(() => $state),
      isGrouping: jest.fn().mockImplementation(() => $isGrouping),
    };
    $displayedZoneId = signal(zone_id);
    settingsService = {
      displayedZonedId: jest.fn().mockImplementation(() => $displayedZoneId),
    };
    TestBed.configureTestingModule({
      providers: [
        MockProvider(RoonService, roonService as Partial<RoonService>),
        MockProvider(SettingsService, settingsService as Partial<SettingsService>),
      ],
      imports: [NrRootComponent],
    });
    fixture = TestBed.createComponent(NrRootComponent);
    component = fixture.componentInstance;
  });

  it("should create the nr-root", () => {
    expect(component).toBeTruthy();
  });
});

const zone_id = "zone_id";
