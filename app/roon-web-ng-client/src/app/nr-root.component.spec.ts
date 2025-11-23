import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ApiState, RoonState } from "@nihilux/roon-web-model";
import { DialogService } from "@services/dialog.service";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { NrRootComponent } from "./nr-root.component";

describe("NrRootComponent", () => {
  let component: NrRootComponent;
  let fixture: ComponentFixture<NrRootComponent>;
  let $displayedZoneId: WritableSignal<string>;
  let $state: WritableSignal<ApiState>;
  let $isGrouping: WritableSignal<boolean>;
  let dialogService: {
    close: Mock;
  };
  let roonService: {
    roonState: Mock;
    isGrouping: Mock;
  };
  let settingsService: {
    displayedZonedId: Mock;
  };

  beforeEach(async () => {
    dialogService = {
      close: vi.fn(),
    };
    $state = signal({
      state: RoonState.STARTING,
      zones: [],
      outputs: [],
    });
    $isGrouping = signal(false);
    roonService = {
      roonState: vi.fn().mockImplementation(() => $state),
      isGrouping: vi.fn().mockImplementation(() => $isGrouping),
    };
    $displayedZoneId = signal(zone_id);
    settingsService = {
      displayedZonedId: vi.fn().mockImplementation(() => $displayedZoneId),
    };
    TestBed.configureTestingModule({
      imports: [NrRootComponent],
      providers: [
        MockProvider(DialogService, dialogService),
        MockProvider(RoonService, roonService),
        MockProvider(SettingsService, settingsService as Partial<SettingsService>),
      ],
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(NrRootComponent);
    component = fixture.componentInstance;
  });

  it("should create the nr-root", () => {
    expect(component).toBeTruthy();
  });
});

const zone_id = "zone_id";
