import { Subscription } from "rxjs";
import { ChangeDetectionStrategy, Component, OnDestroy, Signal, signal } from "@angular/core";
import { MatButton, MatFabButton, MatMiniFabButton } from "@angular/material/button";
import {
  MatDialog,
  MatDialogActions,
  MatDialogConfig,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { CustomActionsManagerComponent } from "@components/custom-actions-manager/custom-actions-manager.component";
import { RoonBrowseDialogComponent } from "@components/roon-browse-dialog/roon-browse-dialog.component";
import { RoonApiBrowseHierarchy } from "@model";
import { CustomActionsManagerDialogConfig } from "@model/client";
import { SettingsService } from "@services/settings.service";

interface RecordableHierarchy {
  hierarchy: RoonApiBrowseHierarchy;
  label: string;
  icon: string;
}

@Component({
  selector: "nr-custom-action-recorder",
  standalone: true,
  imports: [MatButton, MatFabButton, MatDialogActions, MatDialogContent, MatDialogTitle, MatIcon, MatMiniFabButton],
  templateUrl: "./custom-action-recorder.component.html",
  styleUrl: "./custom-action-recorder.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomActionRecorderComponent implements OnDestroy {
  readonly recordableHierarchies: RecordableHierarchy[] = [
    {
      hierarchy: "albums",
      label: "Albums",
      icon: "album",
    },
    {
      hierarchy: "artists",
      label: "Artists",
      icon: "artist",
    },
    {
      hierarchy: "browse",
      label: "Browse",
      icon: "explore",
    },
    {
      hierarchy: "composers",
      label: "Composers",
      icon: "music_note",
    },
    {
      hierarchy: "genres",
      label: "Genres",
      icon: "artist",
    },
    {
      hierarchy: "playlists",
      label: "Playlists",
      icon: "featured_play_list",
    },
    {
      hierarchy: "internet_radio",
      label: "Radios",
      icon: "radio",
    },
  ];
  private readonly _dialog: MatDialog;
  private readonly _dialogRef: MatDialogRef<CustomActionRecorderComponent>;
  private readonly _closeDialogSubscription: Subscription;
  private readonly _$layoutClass: Signal<string>;
  readonly $hierarchy: Signal<RoonApiBrowseHierarchy | undefined>;
  readonly $path: Signal<string[]>;
  readonly $actionIndex: Signal<number | undefined>;
  private _isRecording: boolean;

  constructor(
    matDialog: MatDialog,
    dialogRef: MatDialogRef<CustomActionRecorderComponent>,
    settingsService: SettingsService
  ) {
    this._dialog = matDialog;
    this._dialogRef = dialogRef;
    this._$layoutClass = settingsService.displayModeClass();
    this.$hierarchy = signal(undefined);
    this.$path = signal([]);
    this.$actionIndex = signal(undefined);
    this._isRecording = false;
    this._closeDialogSubscription = this._dialogRef.beforeClosed().subscribe(() => {
      if (!this._isRecording) {
        this._dialog.open(CustomActionsManagerComponent, {
          ...CustomActionsManagerDialogConfig,
          panelClass: ["nr-dialog-custom", this._$layoutClass()],
        });
      }
    });
  }

  startRecording(hierarchy: RecordableHierarchy) {
    this._isRecording = true;
    const config: MatDialogConfig = {
      restoreFocus: false,
      data: {
        path: {
          hierarchy: hierarchy.hierarchy,
          path: [],
        },
        isRecording: true,
      },
      autoFocus: false,
      height: "95svh",
      maxHeight: "95svh",
      width: "90svw",
      maxWidth: "90svw",
      panelClass: ["nr-dialog-custom", this._$layoutClass()],
    };
    this._dialog.open(RoonBrowseDialogComponent, config);
    this._dialogRef.close();
  }

  onCancel() {
    this._dialogRef.close();
  }

  ngOnDestroy() {
    this._closeDialogSubscription.unsubscribe();
  }
}
