import { MockBuilder, MockRender } from "ng-mocks";
import { Subject } from "rxjs";
import { ComponentFixture } from "@angular/core/testing";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { CustomActionRecorderComponent } from "./custom-action-recorder.component";

describe("CustomActionRecorderComponent", () => {
  let dialogOpen: jest.Mock;
  let beforeClosedDialog: jest.Mock;
  let beforeClosedObservable: Subject<void>;
  let closeDialog: jest.Mock;
  let component: CustomActionRecorderComponent;
  let fixture: ComponentFixture<CustomActionRecorderComponent>;

  beforeEach(async () => {
    dialogOpen = jest.fn();
    closeDialog = jest.fn();
    beforeClosedObservable = new Subject<void>();
    beforeClosedDialog = jest.fn().mockImplementation(() => beforeClosedObservable);
    await MockBuilder(CustomActionRecorderComponent)
      .mock(MatDialog, {
        open: dialogOpen,
      })
      .mock(MatDialogRef<CustomActionRecorderComponent>, {
        close: closeDialog,
        beforeClosed: beforeClosedDialog,
      });
    fixture = MockRender(CustomActionRecorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
