import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Subject } from "rxjs";
import { signal, WritableSignal } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { RoonApiBrowseHierarchy } from "@model";
import { CustomActionsService } from "@services/custom-actions.service";
import { CustomActionEditorComponent } from "./custom-action-editor.component";

describe("CustomActionEditorComponent", () => {
  let dialogOpen: jest.Mock;
  let beforeClosedDialog: jest.Mock;
  let beforeClosedObservable: Subject<void>;
  let closeDialog: jest.Mock;
  let $label: WritableSignal<string>;
  let $icon: WritableSignal<string>;
  let $hierarchy: WritableSignal<RoonApiBrowseHierarchy | undefined>;
  let $path: WritableSignal<string[]>;
  let $actionIndex: WritableSignal<number | undefined>;
  let saveLabel: jest.Mock;
  let saveIcon: jest.Mock;
  let component: CustomActionEditorComponent;
  let fixture: MockedComponentFixture<CustomActionEditorComponent>;

  beforeEach(async () => {
    dialogOpen = jest.fn();
    closeDialog = jest.fn();
    beforeClosedObservable = new Subject<void>();
    beforeClosedDialog = jest.fn().mockImplementation(() => beforeClosedObservable);
    $label = signal("label");
    $icon = signal("icon");
    $hierarchy = signal(undefined);
    $path = signal([]);
    $actionIndex = signal(undefined);
    saveLabel = jest.fn().mockImplementation((label: string) => {
      $label.set(label);
    });
    saveIcon = jest.fn().mockImplementation((icon: string) => {
      $icon.set(icon);
    });
    await MockBuilder(CustomActionEditorComponent)
      .mock(MatDialog, {
        open: dialogOpen,
      })
      .mock(MatDialogRef<CustomActionEditorComponent>, {
        close: closeDialog,
        beforeClosed: beforeClosedDialog,
      })
      .mock(CustomActionsService, {
        label: () => $label,
        icon: () => $icon,
        hierarchy: () => $hierarchy,
        path: () => $path,
        actionIndex: () => $actionIndex,
        saveLabel,
        saveIcon,
      });
    fixture = MockRender(CustomActionEditorComponent);
    component = fixture.componentInstance as CustomActionEditorComponent;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
