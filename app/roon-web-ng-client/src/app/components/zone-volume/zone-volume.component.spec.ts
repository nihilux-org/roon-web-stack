import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DisplayMode } from "@model";
import { Output } from "@nihilux/roon-web-model";
import { DialogService } from "@services/dialog.service";
import { SettingsService } from "@services/settings.service";
import { VolumeService } from "@services/volume.service";
import { ZoneVolumeComponent } from "./zone-volume.component";

describe("ZoneVolumeComponent", () => {
  let component: ZoneVolumeComponent;
  let fixture: ComponentFixture<ZoneVolumeComponent>;
  let $displayMode: WritableSignal<DisplayMode>;
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    isSmallScreen: Mock;
    displayMode: Mock;
  };
  let $outputs: WritableSignal<Output[]>;
  let $isMuted: WritableSignal<boolean>;
  let volumeService: {
    outputs: Mock;
    isMute: Mock;
  };
  let dialogService: {
    open: Mock;
  };

  beforeEach(async () => {
    $outputs = signal([]);
    $displayMode = signal(DisplayMode.WIDE);
    $isSmallScreen = signal(false);
    settingsService = {
      displayMode: vi.fn().mockImplementation(() => $displayMode),
      isSmallScreen: vi.fn().mockImplementation(() => $isSmallScreen),
    };
    $isMuted = signal(false);
    $outputs = signal([]);
    volumeService = {
      outputs: vi.fn().mockImplementation(() => $outputs),
      isMute: vi.fn().mockImplementation(() => $isMuted),
    };
    dialogService = {
      open: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [ZoneVolumeComponent],
      providers: [
        MockProvider(DialogService, dialogService),
        MockProvider(SettingsService, settingsService),
        MockProvider(VolumeService, volumeService),
      ],
    });
    fixture = TestBed.createComponent(ZoneVolumeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
