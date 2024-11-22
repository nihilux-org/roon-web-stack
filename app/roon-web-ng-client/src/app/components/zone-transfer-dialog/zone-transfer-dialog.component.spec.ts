import { MockProvider } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { ApiState, Command, RoonState } from "@model";
import { CommandCallback } from "@model/client";
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
    roonState: jest.Mock;
    command: jest.Mock;
  };
  let settingsService: {
    displayedZoneId: jest.Mock;
    saveDisplayedZoneId: jest.Mock;
    isSmallScreen: jest.Mock;
  };
  let closeDialog: jest.Mock;
  let component: ZoneTransferDialogComponent;
  let fixture: ComponentFixture<ZoneTransferDialogComponent>;

  beforeEach(() => {
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
      roonState: jest.fn().mockImplementation(() => $roonState),
      command: jest.fn().mockImplementation((command: Command, callback: CommandCallback) => {
        commands.push(command);
        commandCallbacks.push(callback);
      }),
    };
    settingsService = {
      displayedZoneId: jest.fn().mockImplementation(() => $displayedZoneId),
      saveDisplayedZoneId: jest.fn().mockImplementation((zone_id: string) => {
        $displayedZoneId.set(zone_id);
      }),
      isSmallScreen: jest.fn().mockImplementation(() => $isSmallScreen),
    };
    closeDialog = jest.fn();
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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
