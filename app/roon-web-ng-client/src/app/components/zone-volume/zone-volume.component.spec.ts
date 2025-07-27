import { MockProvider } from "ng-mocks";
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
    isSmallScreen: jest.Mock;
    displayMode: jest.Mock;
  };
  let $outputs: WritableSignal<Output[]>;
  let $isMuted: WritableSignal<boolean>;
  let volumeService: {
    outputs: jest.Mock;
    isMute: jest.Mock;
  };
  let dialogService: {
    open: jest.Mock;
  };

  beforeEach(() => {
    $outputs = signal([]);
    $displayMode = signal(DisplayMode.WIDE);
    $isSmallScreen = signal(false);
    settingsService = {
      displayMode: jest.fn().mockImplementation(() => $displayMode),
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    $isMuted = signal(false);
    $outputs = signal([]);
    volumeService = {
      outputs: jest.fn().mockImplementation(() => $outputs),
      isMute: jest.fn().mockImplementation(() => $isMuted),
    };
    dialogService = {
      open: jest.fn(),
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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
