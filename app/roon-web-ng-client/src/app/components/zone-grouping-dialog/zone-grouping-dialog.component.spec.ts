import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { CommandCallback, OutputCallback } from "@model";
import { ApiState, Command, OutputDescription, RoonState, ZoneState } from "@nihilux/roon-web-model";
import { RoonService } from "@services/roon.service";
import { SettingsService } from "@services/settings.service";
import { ZoneGroupingDialogComponent } from "./zone-grouping-dialog.component";

describe("ZoneGroupingDialogComponent", () => {
  let $roonState: WritableSignal<ApiState>;
  let $zone: WritableSignal<ZoneState>;
  let commands: Command[];
  let callbacks: CommandCallback[];
  let outputCallbacks: OutputCallback[];
  let roonService: {
    roonState: Mock;
    zoneState: Mock;
    registerOutputCallback: Mock;
    command: Mock;
  };
  let $displayedZoneId: WritableSignal<string>;
  let $isSmallScreen: WritableSignal<boolean>;
  let settingsService: {
    displayedZoneId: Mock;
    saveDisplayedZoneId: Mock;
    isSmallScreen: Mock;
  };
  let closeDialog: Mock;
  let component: ZoneGroupingDialogComponent;
  let fixture: ComponentFixture<ZoneGroupingDialogComponent>;

  beforeEach(async () => {
    $roonState = signal({
      state: RoonState.SYNC,
      zones: [],
      outputs: OUTPUTS,
    });
    $zone = signal({
      outputs: [
        {
          output_id: OUTPUTS[0].output_id,
          display_name: OUTPUTS[0].display_name,
          can_group_with_output_ids: [OUTPUTS[0].output_id, OUTPUTS[1].output_id],
        },
      ],
    } as unknown as ZoneState);
    commands = [];
    callbacks = [];
    outputCallbacks = [];
    roonService = {
      zoneState: vi.fn().mockImplementation(() => $zone),
      command: vi.fn().mockImplementation((c: Command, callback: CommandCallback) => {
        commands.push(c);
        callbacks.push(callback);
      }),
      registerOutputCallback: vi.fn().mockImplementation((oc: OutputCallback) => outputCallbacks.push(oc)),
      roonState: vi.fn().mockImplementation(() => $roonState),
    };
    $displayedZoneId = signal("zone_id");
    $isSmallScreen = signal(false);
    settingsService = {
      displayedZoneId: vi.fn().mockImplementation(() => $displayedZoneId),
      saveDisplayedZoneId: vi.fn().mockImplementation((zone_id: string) => {
        $displayedZoneId.set(zone_id);
      }),
      isSmallScreen: vi.fn().mockImplementation(() => $isSmallScreen),
    };
    closeDialog = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        MockProvider(RoonService, roonService),
        MockProvider(SettingsService, settingsService),
        MockProvider(MatDialogRef<ZoneGroupingDialogComponent>, {
          close: closeDialog,
        }),
      ],
      imports: [ZoneGroupingDialogComponent],
    });

    fixture = TestBed.createComponent(ZoneGroupingDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

const OUTPUTS: OutputDescription[] = [
  {
    output_id: "output_id",
    display_name: "display_name",
    zone_id: "zone_id",
  },
  {
    output_id: "other_output_id",
    display_name: "other_display_name",
    zone_id: "other_zone_id",
  },
  {
    output_id: "yet_another_output_id",
    display_name: "yet_another_display_name",
    zone_id: "yet_another_zone_id",
  },
];
