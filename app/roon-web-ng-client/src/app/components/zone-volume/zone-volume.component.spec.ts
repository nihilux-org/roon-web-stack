import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Signal, signal, WritableSignal } from "@angular/core";
import { Output } from "@model";
import { SettingsService } from "@services/settings.service";
import { ZoneVolumeComponent } from "./zone-volume.component";

describe("ZoneVolumeComponent", () => {
  let component: ZoneVolumeComponent;
  let fixture: MockedComponentFixture<ZoneVolumeComponent, { $outputs: Signal<Output[]> }>;
  let $outputs: WritableSignal<Output[]>;
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    isSmallScreen: jest.Mock;
  };

  beforeEach(async () => {
    $outputs = signal([]);
    $isSmallScreen = signal(false);
    settingsService = {
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    await MockBuilder(ZoneVolumeComponent).mock(SettingsService, settingsService as Partial<SettingsService>);
    fixture = MockRender(ZoneVolumeComponent, {
      $outputs,
    });
    component = fixture.componentInstance as ZoneVolumeComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
