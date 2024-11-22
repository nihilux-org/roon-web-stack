import { MockProvider } from "ng-mocks";
import { Subject } from "rxjs";
import { Signal, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TrackDisplay } from "@model/client";
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
    saveDisplayQueueTrack: jest.Mock;
    displayModeClass: jest.Mock;
  };
  let beforeClosedDialogObservable: Subject<void>;
  let closeDialog: jest.Mock;
  let component: ZoneQueueDialogComponent;
  let fixture: ComponentFixture<ZoneQueueDialogComponent>;

  beforeEach(() => {
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
      saveDisplayQueueTrack: jest.fn().mockImplementation((saved: boolean) => savedDisplayedQueueTrack.push(saved)),
      displayModeClass: jest.fn().mockImplementation(() => $displayModeClass),
    };
    beforeClosedDialogObservable = new Subject<void>();
    closeDialog = jest.fn();
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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
