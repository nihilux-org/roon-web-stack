import { MockBuilder, MockRender } from "ng-mocks";
import { Subject } from "rxjs";
import { ComponentFixture } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { DialogService } from "@services/dialog.service";
import { CustomActionRecorderComponent } from "./custom-action-recorder.component";

describe("CustomActionRecorderComponent", () => {
  let dialogService: {
    open: jest.Mock;
    close: jest.Mock;
  };
  let afterClosedDialog: jest.Mock;
  let afterClosedDialogObservable: Subject<void>;
  let component: CustomActionRecorderComponent;
  let fixture: ComponentFixture<CustomActionRecorderComponent>;

  beforeEach(async () => {
    dialogService = {
      open: jest.fn(),
      close: jest.fn(),
    };
    afterClosedDialogObservable = new Subject<void>();
    afterClosedDialog = jest.fn().mockImplementation(() => afterClosedDialogObservable);
    await MockBuilder(CustomActionRecorderComponent)
      .mock(DialogService, dialogService as Partial<DialogService>)
      .mock(MatDialogRef<CustomActionRecorderComponent>, {
        afterClosed: afterClosedDialog,
      });
    fixture = MockRender(CustomActionRecorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
