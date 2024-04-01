import { MockBuilder, MockRender } from "ng-mocks";
import { Signal, signal, WritableSignal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TrackDisplay } from "@model/client";
import { ZoneQueueDialogComponent } from "./zone-queue-dialog.component";

describe("ZoneQueueDialogComponent", () => {
  let $trackDisplay: WritableSignal<TrackDisplay>;
  let dialogData: {
    $trackDisplay: Signal<TrackDisplay>;
  };
  let closeDialog: jest.Mock;
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
    closeDialog = jest.fn();
    await MockBuilder(ZoneQueueDialogComponent)
      .mock(MAT_DIALOG_DATA, dialogData)
      .mock(MatDialogRef<ZoneQueueDialogComponent>, {
        close: closeDialog,
      });

    fixture = MockRender(ZoneQueueDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
