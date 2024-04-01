import { Component, Inject, Signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { ZoneQueueComponent } from "@components/zone-queue/zone-queue.component";
import { TrackDisplay } from "@model/client";

@Component({
  selector: "nr-zone-queue-dialog",
  standalone: true,
  imports: [MatButton, MatDialogActions, MatDialogContent, MatIcon, ZoneQueueComponent],
  templateUrl: "./zone-queue-dialog.component.html",
  styleUrl: "./zone-queue-dialog.component.scss",
})
export class ZoneQueueDialogComponent {
  private readonly _dialogRef: MatDialogRef<ZoneQueueDialogComponent>;
  readonly $trackDisplay: Signal<TrackDisplay>;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { $trackDisplay: Signal<TrackDisplay> },
    dialogRef: MatDialogRef<ZoneQueueDialogComponent>
  ) {
    this._dialogRef = dialogRef;
    this.$trackDisplay = data.$trackDisplay;
  }

  closeDialog() {
    this._dialogRef.close();
  }
}
