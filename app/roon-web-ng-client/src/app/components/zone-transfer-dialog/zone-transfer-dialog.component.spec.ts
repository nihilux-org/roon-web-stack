import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { CommandCallback } from "@model";
import { ApiState, Command, RoonState } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneTransferDialogComponent } from "./zone-transfer-dialog.component";

describe("ZoneTransferDialogComponent", () => {
  let $roonState: WritableSignal<ApiState>;
  let $displayedZoneId: WritableSignal<string>;
  let $isSmallScreen: WritableSignal<boolean>;
  let commands: Command[];
  let commandCallbacks: CommandCallback[];
  let roonService: {
    roonState: Mock;
    command: Mock;
  };
  let settingsService: {
    displayedZoneId: Mock;
    saveDisplayedZoneId: Mock;
    isSmallScreen: Mock;
  };
  let closeDialog: Mock;
  let component: ZoneTransferDialogComponent;
  let fixture: ComponentFixture<ZoneTransferDialogComponent>;

  beforeEach(async () => {
    $roonState = signal({
      state: RoonState.SYNC,
      zones: [],
      outputs: [],
    });
    $displayedZoneId = signal("zone_id");
    $isSmallScreen = signal(false);
    commands = [];
    commandCallbacks = [];
    roonService = {
      roonState: vi.fn().mockImplementation(() => $roonState),
      command: vi.fn().mockImplementation((command: Command, callback: CommandCallback) => {
        commands.push(command);
        commandCallbacks.push(callback);
      }),
    };
    settingsService = {
      displayedZoneId: vi.fn().mockImplementation(() => $displayedZoneId),
      saveDisplayedZoneId: vi.fn().mockImplementation((zone_id: string) => {
        $displayedZoneId.set(zone_id);
      }),
      isSmallScreen: vi.fn().mockImplementation(() => $isSmallScreen),
    };
    closeDialog = vi.fn();
    TestBed.configureTestingModule({
      imports: [ZoneTransferDialogComponent],
      providers: [
        MockProvider(SettingsService, settingsService),
        MockProvider(RoonService, roonService),
        MockProvider(MatDialogRef<ZoneTransferDialogComponent>, {
          close: closeDialog,
        }),
      ],
    });
    fixture = TestBed.createComponent(ZoneTransferDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
