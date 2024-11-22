import { MockProvider } from "ng-mocks";
import { Subject } from "rxjs";
import { ComponentFixture, TestBed } from "@angular/core/testing";
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

  beforeEach(() => {
    dialogService = {
      open: jest.fn(),
      close: jest.fn(),
    };
    afterClosedDialogObservable = new Subject<void>();
    afterClosedDialog = jest.fn().mockImplementation(() => afterClosedDialogObservable);
    TestBed.configureTestingModule({
      providers: [
        MockProvider(DialogService, dialogService as Partial<DialogService>),
        MockProvider(MatDialogRef<CustomActionRecorderComponent>, {
          afterClosed: afterClosedDialog,
        }),
      ],
      imports: [CustomActionRecorderComponent],
    });
    fixture = TestBed.createComponent(CustomActionRecorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
