import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTab } from "@angular/material/tabs";
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
  let fixture: MockedComponentFixture<CustomActionsManagerComponent>;

  beforeEach(async () => {
    $customActions = signal([]);
    $isEditing = signal(false);
    $isValid = signal(false);
    cancelEdition = jest.fn();
    saveAction = jest.fn();
    createAction = jest.fn();
    editAction = jest.fn();
    deleteAction = jest.fn();
    command = jest.fn();

    await MockBuilder(CustomActionsManagerComponent)
      .mock(MAT_DIALOG_DATA, { reset: true })
      .mock(DialogService, dialogService as Partial<DialogService>)
      .mock(CustomActionsService, {
        isEditing: () => $isEditing,
        isValid: () => $isValid,
        customActions: () => $customActions,
        cancelEdition,
        saveAction,
        createAction,
        editAction,
        deleteAction,
      })
      .mock(RoonService, {
        command,
      })
      .keep(MatTab);
    fixture = MockRender(CustomActionsManagerComponent);
    component = fixture.componentInstance as CustomActionsManagerComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
