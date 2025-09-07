import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: "nr-info-dialog",
  templateUrl: "./info-dialog.component.html",
  styleUrls: ["./info-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatDialogContent, MatDialogActions, MatButton, MatIcon],
})
export class InfoDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title?: string; message: string },
    private readonly _ref: MatDialogRef<InfoDialogComponent>
  ) {}

  close() {
    this._ref.close();
  }
}

