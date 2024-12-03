import {
  RoonApiSettings, RoonApiSettingsOptions,
  RoonExtension,
  SaveSettingsStatus,
  SettingsLayout,
  SettingsValues, ValidatedSettingsValues,
} from "@model";
import { RoonKit } from "./RoonKit";

export class RoonExtensionSettings<T extends SettingsValues> implements RoonApiSettings<T> {
  private static readonly SETTINGS_CONFIG_KEY = "nr.SETTINGS_CONFIG_KEY";
  private readonly _roon_api_settings: RoonApiSettings<T>;
  private readonly _roon_extension: RoonExtension;
  private readonly _options: RoonApiSettingsOptions<T>;
  private _has_error: boolean;
  private _values: T;

  constructor(roonExtension: RoonExtension, roonApiSettingsOptions: RoonApiSettingsOptions<T>) {
    this._roon_extension = roonExtension;
    this._options = roonApiSettingsOptions;
    const savedValues: Partial<T> = this._roon_extension.api().load_config(RoonExtensionSettings.SETTINGS_CONFIG_KEY) ?? {};
    this._values =  {
      ...this._options.default_values,
      ...savedValues,
    };
    this._has_error = false;
    this._roon_api_settings = new RoonKit.RoonApiSettings(this._roon_extension.api(), {
      get_settings: (sendSettings) => {
        const settingsLayout = this._options.build_layout(this._values, this._has_error, this._roon_extension);
        sendSettings(settingsLayout);
      },
      save_settings: (
        req: { send_complete: (status: SaveSettingsStatus, settingsLayout: { settings: SettingsLayout<T> }) => void },
        isDryRun: boolean,
        settingToSave: { values: Partial<T> }
      ): void => {
        const validatedSettings = this._options.validate_settings(settingToSave.values, this._roon_extension);
        this.apply_settings(validatedSettings);
        const status: SaveSettingsStatus = this._has_error ? "NotValid" : "Success";
        const settings = this._options.build_layout(this._values, this._has_error, this._roon_extension);
        req.send_complete(status, { settings });
        if (!isDryRun && !this._has_error) {
          this._options.dispatch_settings(this._roon_extension, this._values);
        }
      },
    });
  }

  public update_settings(setting_layout: SettingsLayout<T>): void {
    this._roon_api_settings.update_settings(setting_layout);
  }

  protected apply_settings(settings_to_save: ValidatedSettingsValues<T>): void {
    this._values = {
      ...this._values,
      ...settings_to_save.values,
    };
    this._has_error = settings_to_save.has_error;
    if (!this._has_error) {
      this._roon_extension.api().save_config(RoonExtensionSettings.SETTINGS_CONFIG_KEY, this._values);
    }
  }

  public service(): RoonApiSettings<T> {
    return this._roon_api_settings;
  }
}
