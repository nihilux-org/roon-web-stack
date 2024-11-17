import { Subscription } from "rxjs";
import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, Inject, OnDestroy, Signal, TemplateRef } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { ZoneQueueComponent } from "@components/zone-queue/zone-queue.component";
import { LayoutContext, TrackDisplay } from "@model/client";
import { SettingsService } from "@services/settings.service";

@Component({
  selector: "nr-zone-queue-dialog",
  standalone: true,
  imports: [MatButton, MatDialogActions, MatDialogContent, MatIcon, ZoneQueueComponent, NgTemplateOutlet],
  templateUrl: "./zone-queue-dialog.component.html",
  styleUrl: "./zone-queue-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneQueueDialogComponent implements OnDestroy {
  private readonly _dialogRef: MatDialogRef<ZoneQueueDialogComponent>;
  private readonly _dialogRefCloseSubscription: Subscription;
  private readonly _settingsService: SettingsService;
  readonly $trackDisplay: Signal<TrackDisplay>;
  readonly queueComponentTemplateRef: TemplateRef<LayoutContext>;
  readonly queueComponentTemplateContext: LayoutContext;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: { $trackDisplay: Signal<TrackDisplay>; queueComponentTemplateRef: TemplateRef<LayoutContext> },
    dialogRef: MatDialogRef<ZoneQueueDialogComponent>,
    settingsService: SettingsService
  ) {
    this._dialogRef = dialogRef;
    this._settingsService = settingsService;
    this.$trackDisplay = data.$trackDisplay;
    this.queueComponentTemplateRef = data.queueComponentTemplateRef;
    this.queueComponentTemplateContext = {
      class: `in-dialog ${this._settingsService.displayModeClass()()}`,
    };
    this._dialogRefCloseSubscription = this._dialogRef.beforeClosed().subscribe(() => {
      this._settingsService.saveDisplayQueueTrack(false);
    });
  }

  closeDialog() {
    this._dialogRef.close();
  }

  ngOnDestroy() {
    this._dialogRefCloseSubscription.unsubscribe();
  }
}
