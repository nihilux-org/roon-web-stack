import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { signal, WritableSignal } from "@angular/core";
import { RoonApiBrowseHierarchy } from "@model";
import { CustomActionsService } from "@services/custom-actions.service";
import { DialogService } from "@services/dialog.service";
import { CustomActionEditorComponent } from "./custom-action-editor.component";

describe("CustomActionEditorComponent", () => {
  let dialogService: {
    open: jest.Mock;
  };
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
    dialogService = {
      open: jest.fn(),
    };
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
      .mock(DialogService, dialogService as Partial<DialogService>)
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
