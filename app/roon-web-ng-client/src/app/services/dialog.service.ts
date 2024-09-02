import { ComponentType } from "@angular/cdk/overlay";
import { Injectable, Signal } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { SettingsService } from "@services/settings.service";

@Injectable({
  providedIn: "root",
})
export class DialogService {
  private readonly _dialog: MatDialog;
  private readonly _$layoutClass: Signal<string>;
  private _openedDialog?: MatDialogRef<unknown>;

  constructor(dialog: MatDialog, settingsService: SettingsService) {
    this._dialog = dialog;
    this._$layoutClass = settingsService.displayModeClass();
  }

  open<T, D = never>(component: ComponentType<T>, config?: MatDialogConfig<D>): void {
    const panelClass = [...((config?.panelClass ?? []) as string[])];
    panelClass.push("nr-dialog-custom", this._$layoutClass());
    this._openedDialog?.close();
    this._openedDialog = this._dialog.open(component, {
      ...config,
      panelClass,
    });
    this._openedDialog.afterClosed().subscribe(() => {
      delete this._openedDialog;
    });
  }

  close() {
    this._openedDialog?.close();
    delete this._openedDialog;
  }
}
