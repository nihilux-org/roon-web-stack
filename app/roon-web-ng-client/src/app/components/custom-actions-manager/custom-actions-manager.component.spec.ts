import { MockProvider } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CustomAction } from "@model/client";
import { CustomActionsService } from "@services/custom-actions.service";
import { DialogService } from "@services/dialog.service";
import { RoonService } from "@services/roon.service";
import { CustomActionsManagerComponent } from "./custom-actions-manager.component";

describe("CustomActionManagerComponent", () => {
  let dialogService: {
    open: jest.Mock;
    close: jest.Mock;
  };
  let $customActions: WritableSignal<CustomAction[]>;
  let $isEditing: WritableSignal<boolean>;
  let $isValid: WritableSignal<boolean>;
  let cancelEdition: jest.Mock;
  let saveAction: jest.Mock;
  let createAction: jest.Mock;
  let editAction: jest.Mock;
  let deleteAction: jest.Mock;
  let command: jest.Mock;
  let component: CustomActionsManagerComponent;
  let fixture: ComponentFixture<CustomActionsManagerComponent>;

  beforeEach(() => {
    $customActions = signal([]);
    $isEditing = signal(false);
    $isValid = signal(false);
    cancelEdition = jest.fn();
    saveAction = jest.fn();
    createAction = jest.fn();
    editAction = jest.fn();
    deleteAction = jest.fn();
    command = jest.fn();
    dialogService = {
      close: jest.fn(),
      open: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        MockProvider(DialogService, dialogService as Partial<DialogService>),
        MockProvider(CustomActionsService, {
          isEditing: () => $isEditing,
          isValid: () => $isValid,
          customActions: () => $customActions,
          cancelEdition,
          saveAction,
          createAction,
          editAction,
          deleteAction,
        }),
        MockProvider(RoonService, {
          command,
        }),
        MockProvider(MAT_DIALOG_DATA, {
          reset: false,
        }),
      ],
      imports: [CustomActionsManagerComponent],
    });
    fixture = TestBed.createComponent(CustomActionsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
