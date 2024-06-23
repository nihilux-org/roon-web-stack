import { nanoid } from "nanoid";
import { computed, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { CommandType, RoonApiBrowseHierarchy, SharedConfig, SharedConfigCommand } from "@model";
import { ActionType, CustomAction, EditedCustomAction } from "@model/client";

@Injectable({
  providedIn: "root",
})
export class CustomActionsService {
  private readonly _$customActions: WritableSignal<CustomAction[]>;
  private readonly _$editedAction: WritableSignal<EditedCustomAction | undefined>;
  private readonly _$isEditing: Signal<boolean>;
  private readonly _$isValid: Signal<boolean>;
  private readonly _$label: Signal<string | undefined>;
  private readonly _$icon: Signal<string | undefined>;
  private readonly _$hierarchy: Signal<RoonApiBrowseHierarchy | undefined>;
  private readonly _$path: Signal<string[]>;
  private readonly _$actionIndex: Signal<number | undefined>;

  constructor() {
    this._$customActions = signal([]);
    this._$editedAction = signal(undefined);
    this._$isEditing = computed(() => this._$editedAction() !== undefined);
    this._$isValid = computed(() => {
      const editedAction = this._$editedAction();
      if (editedAction) {
        return (
          editedAction.label !== undefined &&
          editedAction.label.length > 0 &&
          editedAction.icon !== undefined &&
          editedAction.icon.length > 0 &&
          editedAction.hierarchy !== undefined
        );
      } else {
        return true;
      }
    });
    this._$label = computed(() => this._$editedAction()?.label);
    this._$icon = computed(() => this._$editedAction()?.icon);
    this._$hierarchy = computed(() => this._$editedAction()?.hierarchy);
    this._$path = computed(() => this._$editedAction()?.path ?? []);
    this._$actionIndex = computed(() => this._$editedAction()?.actionIndex);
  }

  customActions(): Signal<CustomAction[]> {
    return this._$customActions;
  }

  isEditing(): Signal<boolean> {
    return this._$isEditing;
  }

  isValid(): Signal<boolean> {
    return this._$isValid;
  }

  label(): Signal<string | undefined> {
    return this._$label;
  }

  saveLabel(label: string) {
    this._$editedAction.update((ea) => {
      if (ea) {
        return {
          ...ea,
          label,
        };
      }
      return ea;
    });
  }

  icon(): Signal<string | undefined> {
    return this._$icon;
  }

  saveIcon(icon: string) {
    this._$editedAction.update((ea) => {
      if (ea) {
        return {
          ...ea,
          icon,
        };
      }
      return ea;
    });
  }

  hierarchy(): Signal<RoonApiBrowseHierarchy | undefined> {
    return this._$hierarchy;
  }

  saveHierarchy(hierarchy: RoonApiBrowseHierarchy) {
    this._$editedAction.update((ea) => {
      if (ea) {
        return {
          ...ea,
          hierarchy,
        };
      }
      return ea;
    });
  }

  path(): Signal<string[]> {
    return this._$path;
  }

  savePath(path: string[]) {
    this._$editedAction.update((ea) => {
      if (ea) {
        return {
          ...ea,
          path,
        };
      }
      return ea;
    });
  }

  actionIndex(): Signal<number | undefined> {
    return this._$actionIndex;
  }

  saveActionIndex(actionIndex?: number) {
    this._$editedAction.update((ea) => {
      if (ea) {
        return {
          ...ea,
          actionIndex,
        };
      }
      return ea;
    });
  }

  createAction() {
    this._$editedAction.set({
      id: nanoid(),
      path: [],
    });
  }

  editAction(action: CustomAction) {
    this._$editedAction.set({
      id: action.id,
      label: action.button.label,
      icon: action.button.icon,
      hierarchy: action.path.hierarchy,
      path: action.path.path,
      actionIndex: action.actionIndex,
    });
  }

  deleteAction(actionId: string): SharedConfigCommand {
    const customActions = this._$customActions().filter((ca) => ca.id !== actionId);
    return this.buildCommand(customActions);
  }

  saveAction(): SharedConfigCommand | undefined {
    const editedAction = this._$editedAction();
    if (editedAction !== undefined && this._$isValid()) {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      const customActions = this._$customActions();
      const previousAction = customActions.find((ca) => editedAction.id === ca.id);
      if (previousAction !== undefined) {
        previousAction.button.label = editedAction.label!;
        previousAction.button.icon = editedAction.icon!;
        previousAction.path.hierarchy = editedAction.hierarchy!;
        previousAction.path.path = editedAction.path;
        previousAction.actionIndex = editedAction.actionIndex;
      } else {
        customActions.push({
          id: editedAction.id,
          type: ActionType.CUSTOM,
          button: {
            label: editedAction.label!,
            icon: editedAction.icon!,
          },
          path: {
            hierarchy: editedAction.hierarchy!,
            path: editedAction.path,
          },
          actionIndex: editedAction.actionIndex,
        });
      }
      return this.buildCommand(customActions);
    } else {
      return undefined;
    }
  }

  cancelEdition() {
    this._$editedAction.set(undefined);
  }

  updateSharedConfig(sharedConfig: SharedConfig) {
    const customActions: CustomAction[] = sharedConfig.customActions.map((ca) => ({
      id: ca.id,
      button: {
        label: ca.label,
        icon: ca.icon,
      },
      path: ca.roonPath,
      type: ActionType.CUSTOM,
      actionIndex: ca.actionIndex,
    }));
    this._$customActions.set(customActions);
  }

  private buildCommand(customActions: CustomAction[]): SharedConfigCommand {
    const sharedConfig: SharedConfig = {
      customActions: customActions.map((ca) => ({
        id: ca.id,
        label: ca.button.label,
        icon: ca.button.icon,
        roonPath: ca.path,
        actionIndex: ca.actionIndex,
      })),
    };
    return {
      type: CommandType.SHARED_CONFIG,
      data: {
        sharedConfig,
      },
    };
  }
}
