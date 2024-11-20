import { ComponentType } from "@angular/cdk/overlay";
import { Injectable, Signal } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { NgxSpatialNavigableService } from "@nihilux/ngx-spatial-navigable";
import { IdleService } from "@services/idle.service";
import { SettingsService } from "@services/settings.service";

@Injectable({
  providedIn: "root",
})
export class DialogService {
  private readonly _dialog: MatDialog;
  private readonly _idleService: IdleService;
  private readonly _spatialNavigableService: NgxSpatialNavigableService;
  private readonly _$layoutClass: Signal<string>;
  private _openedDialog?: MatDialogRef<unknown>;
  private _isIdleWatched: boolean;

  constructor(
    dialog: MatDialog,
    idleService: IdleService,
    settingsService: SettingsService,
    spatialNavigableService: NgxSpatialNavigableService
  ) {
    this._dialog = dialog;
    this._idleService = idleService;
    this._spatialNavigableService = spatialNavigableService;
    this._$layoutClass = settingsService.displayModeClass();
    this._isIdleWatched = false;
  }

  open<T, D = never>(component: ComponentType<T>, config?: MatDialogConfig<D>): void {
    const panelClass = [...((config?.panelClass ?? []) as string[])];
    panelClass.push("nr-dialog-custom", this._$layoutClass());
    this._isIdleWatched = this._idleService.isWatching();
    this._openedDialog?.close();
    this._openedDialog = this._dialog.open(component, {
      ...config,
      panelClass,
    });
    const element = this._openedDialog.componentRef?.location.nativeElement as unknown as HTMLElement;
    const spatialNavigationDialog = element.parentElement ?? element;
    this._openedDialog.afterOpened().subscribe(() => {
      if (this._isIdleWatched) {
        this._idleService.stopWatch();
      }
      const autofocus = typeof config?.autoFocus === "string" ? config.autoFocus : false;
      this._spatialNavigableService.dialogOpened(spatialNavigationDialog, autofocus);
    });
    this._openedDialog.beforeClosed().subscribe(() => {
      if (this._isIdleWatched) {
        this._idleService.startWatch();
      }
      this._spatialNavigableService.dialogClosed();
      delete this._openedDialog;
    });
  }

  close() {
    this._openedDialog?.close();
    delete this._openedDialog;
  }
}
