import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { Signal, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Output } from "@nihilux/roon-web-model";
import { DialogService } from "@services/dialog.service";
import { SettingsService } from "@services/settings.service";
import { VolumeService } from "@services/volume.service";
import { ZoneVolumeDialogComponent } from "./zone-volume-dialog.component";

describe("ZoneVolumeDialogComponent", () => {
  let $isSmallScreen: WritableSignal<boolean>;
  let $outputs: Signal<Output[]>;
  let $canGroup: Signal<boolean>;
  let $isGroup: Signal<boolean>;
  let $isGroupedZoneMute: Signal<boolean>;
  let dialogService: {
    open: Mock;
  };
  let settingsService: {
    isSmallScreen: Mock;
  };
  let volumeService: {
    outputs: Mock;
    canGroup: Mock;
    isGrouped: Mock;
    isGroupedZoneMute: Mock;
  };
  let component: ZoneVolumeDialogComponent;
  let fixture: ComponentFixture<ZoneVolumeDialogComponent>;

  beforeEach(async () => {
    $isSmallScreen = signal(false);
    $outputs = signal([]);
    $canGroup = signal(false);
    $isGroup = signal(false);
    $isGroupedZoneMute = signal(false);
    dialogService = {
      open: vi.fn(),
    };
    settingsService = {
      isSmallScreen: vi.fn().mockImplementation(() => $isSmallScreen),
    };
    volumeService = {
      outputs: vi.fn().mockImplementation(() => $outputs),
      canGroup: vi.fn().mockImplementation(() => $canGroup),
      isGrouped: vi.fn().mockImplementation(() => $isGroup),
      isGroupedZoneMute: vi.fn().mockImplementation(() => $isGroupedZoneMute),
    };
    TestBed.configureTestingModule({
      imports: [ZoneVolumeDialogComponent],
      providers: [
        MockProvider(DialogService, dialogService),
        MockProvider(SettingsService, settingsService),
        MockProvider(VolumeService, volumeService),
      ],
    });

    fixture = TestBed.createComponent(ZoneVolumeDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
