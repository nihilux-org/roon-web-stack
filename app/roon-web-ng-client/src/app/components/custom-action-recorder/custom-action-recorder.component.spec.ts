import { MockProvider } from "ng-mocks";
import { Subject } from "rxjs";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { DialogService } from "@services/dialog.service";
import { CustomActionRecorderComponent } from "./custom-action-recorder.component";

describe("CustomActionRecorderComponent", () => {
  let dialogService: {
    open: Mock;
    close: Mock;
  };
  let afterClosedDialog: Mock;
  let afterClosedDialogObservable: Subject<void>;
  let component: CustomActionRecorderComponent;
  let fixture: ComponentFixture<CustomActionRecorderComponent>;

  beforeEach(async () => {
    dialogService = {
      open: vi.fn(),
      close: vi.fn(),
    };
    afterClosedDialogObservable = new Subject<void>();
    afterClosedDialog = vi.fn().mockImplementation(() => afterClosedDialogObservable);
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
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
