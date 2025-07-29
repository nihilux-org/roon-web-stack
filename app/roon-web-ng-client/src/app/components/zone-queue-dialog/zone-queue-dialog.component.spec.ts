import { MockProvider } from "ng-mocks";
import { Subject } from "rxjs";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { Signal, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TrackDisplay } from "@model";
import { SettingsService } from "@services/settings.service";
import { ZoneQueueDialogComponent } from "./zone-queue-dialog.component";

describe("ZoneQueueDialogComponent", () => {
  let $trackDisplay: WritableSignal<TrackDisplay>;
  let $displayModeClass: WritableSignal<string>;
  let savedDisplayedQueueTrack: boolean[];
  let dialogData: {
    $trackDisplay: Signal<TrackDisplay>;
  };
  let settingsService: {
    saveDisplayQueueTrack: Mock;
    displayModeClass: Mock;
  };
  let beforeClosedDialogObservable: Subject<void>;
  let closeDialog: Mock;
  let component: ZoneQueueDialogComponent;
  let fixture: ComponentFixture<ZoneQueueDialogComponent>;

  beforeEach(async () => {
    $trackDisplay = signal({
      title: "track_title",
      image_key: "track_image_key",
      artist: "track_artist",
      disk: {
        title: "track_disk_title",
        artist: "track_artist",
      },
    });
    dialogData = {
      $trackDisplay,
    };
    savedDisplayedQueueTrack = [];
    $displayModeClass = signal("wide");
    settingsService = {
      saveDisplayQueueTrack: vi.fn().mockImplementation((saved: boolean) => savedDisplayedQueueTrack.push(saved)),
      displayModeClass: vi.fn().mockImplementation(() => $displayModeClass),
    };
    beforeClosedDialogObservable = new Subject<void>();
    closeDialog = vi.fn();
    TestBed.configureTestingModule({
      imports: [ZoneQueueDialogComponent],
      providers: [
        MockProvider(MAT_DIALOG_DATA, dialogData),
        MockProvider(SettingsService, settingsService),
        MockProvider(MatDialogRef<ZoneQueueDialogComponent>, {
          close: closeDialog,
          beforeClosed: () => beforeClosedDialogObservable,
        }),
      ],
    });

    fixture = TestBed.createComponent(ZoneQueueDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
