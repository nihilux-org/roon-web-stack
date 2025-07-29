import { MockProvider } from "ng-mocks";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RoonApiBrowseHierarchy } from "@nihilux/roon-web-model";
import { CustomActionsService } from "@services/custom-actions.service";
import { DialogService } from "@services/dialog.service";
import { SettingsService } from "@services/settings.service";
import { CustomActionEditorComponent } from "./custom-action-editor.component";

describe("CustomActionEditorComponent", () => {
  let dialogService: {
    open: Mock;
  };
  let $isBigFonts: WritableSignal<boolean>;
  let $label: WritableSignal<string>;
  let $icon: WritableSignal<string>;
  let $hierarchy: WritableSignal<RoonApiBrowseHierarchy | undefined>;
  let $path: WritableSignal<string[]>;
  let $actionIndex: WritableSignal<number | undefined>;
  let saveLabel: Mock;
  let saveIcon: Mock;
  let component: CustomActionEditorComponent;
  let fixture: ComponentFixture<CustomActionEditorComponent>;

  beforeEach(async () => {
    dialogService = {
      open: vi.fn(),
    };
    $label = signal("label");
    $icon = signal("icon");
    $hierarchy = signal(undefined);
    $path = signal([]);
    $actionIndex = signal(undefined);
    saveLabel = vi.fn().mockImplementation((label: string) => {
      $label.set(label);
    });
    saveIcon = vi.fn().mockImplementation((icon: string) => {
      $icon.set(icon);
    });
    $isBigFonts = signal(false);
    TestBed.configureTestingModule({
      providers: [
        MockProvider(DialogService, dialogService as Partial<DialogService>),
        MockProvider(CustomActionsService, {
          label: () => $label,
          icon: () => $icon,
          hierarchy: () => $hierarchy,
          path: () => $path,
          actionIndex: () => $actionIndex,
          saveLabel,
          saveIcon,
        }),
        MockProvider(SettingsService, {
          isBigFonts: () => $isBigFonts,
        }),
      ],
      imports: [CustomActionEditorComponent],
    });
    fixture = TestBed.createComponent(CustomActionEditorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
