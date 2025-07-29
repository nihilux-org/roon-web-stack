import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CustomAction } from "@model";
import { CustomActionsService } from "@services/custom-actions.service";
import { DialogService } from "@services/dialog.service";
import { RoonService } from "@services/roon.service";
import { CustomActionsManagerComponent } from "./custom-actions-manager.component";

describe("CustomActionManagerComponent", () => {
  let dialogService: {
    open: Mock;
    close: Mock;
  };
  let $customActions: WritableSignal<CustomAction[]>;
  let $isEditing: WritableSignal<boolean>;
  let $isValid: WritableSignal<boolean>;
  let cancelEdition: Mock;
  let saveAction: Mock;
  let createAction: Mock;
  let editAction: Mock;
  let deleteAction: Mock;
  let command: Mock;
  let component: CustomActionsManagerComponent;
  let fixture: ComponentFixture<CustomActionsManagerComponent>;

  beforeEach(async () => {
    $customActions = signal([]);
    $isEditing = signal(false);
    $isValid = signal(false);
    cancelEdition = vi.fn();
    saveAction = vi.fn();
    createAction = vi.fn();
    editAction = vi.fn();
    deleteAction = vi.fn();
    command = vi.fn();
    dialogService = {
      close: vi.fn(),
      open: vi.fn(),
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
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
