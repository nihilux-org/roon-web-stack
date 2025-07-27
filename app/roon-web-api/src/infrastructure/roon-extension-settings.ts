import {
  DropdownSetting,
  ExtensionSettings,
  GroupSetting,
  MutableSetting,
  RoonApiSettingsOptions,
  SettingsLayoutBuilder,
  SettingsValidator,
  SettingsValues,
  StringSetting,
} from "@nihilux/roon-web-model";

const settingsLayoutBuilder: SettingsLayoutBuilder<ExtensionSettings> = (values, has_error) => {
  const queueBotActivation: DropdownSetting = {
    type: "dropdown",
    setting: "nr_queue_bot_state",
    title: "enable Queue Bot feature",
    values: [
      {
        title: "Yes",
        value: "enabled",
      },
      {
        title: "No",
        value: "disabled",
      },
    ],
  };
  const queueBotGroup: GroupSetting = {
    type: "group",
    title: "Queue Bot",
    items: [queueBotActivation],
  };
  if (values.nr_queue_bot_state === "enabled") {
    const queueBotArtistName: StringSetting = {
      type: "string",
      title: "artist name",
      setting: "nr_queue_bot_artist_name",
    };
    has_error = validateMandatorySetting(queueBotArtistName, values) || has_error;
    const queueBotPauseTrackName: StringSetting = {
      type: "string",
      title: "pause action track name",
      setting: "nr_queue_bot_pause_track_name",
    };
    has_error = validateMandatorySetting(queueBotPauseTrackName, values) || has_error;
    const queueBotStandbyTrackName: StringSetting = {
      type: "string",
      title: "standby action track name",
      setting: "nr_queue_bot_standby_track_name",
    };
    has_error = validateMandatorySetting(queueBotStandbyTrackName, values) || has_error;
    queueBotGroup.items.push(queueBotArtistName, queueBotPauseTrackName, queueBotStandbyTrackName);
  }
  return {
    values,
    layout: [queueBotGroup],
    has_error,
  };
};

const validateMandatorySetting = (ms: MutableSetting, values: SettingsValues): boolean => {
  const settingKey = ms.setting;
  const settingValue = values[settingKey];
  if (!settingValue || (typeof settingValue === "string" && settingValue.length === 0)) {
    ms.error = "this field is required";
    return true;
  } else {
    delete ms.error;
    return false;
  }
};

const settingsValidator: SettingsValidator<ExtensionSettings> = (settings_to_save) => {
  let has_error = false;
  if (settings_to_save.nr_queue_bot_pause_track_name === "") {
    has_error = true;
  }
  if (settings_to_save.nr_queue_bot_artist_name === "") {
    has_error = true;
  }
  if (settings_to_save.nr_queue_bot_standby_track_name === "") {
    has_error = true;
  }
  return {
    has_error,
    values: settings_to_save,
  };
};

export const settingsOptions: RoonApiSettingsOptions<ExtensionSettings> = {
  validate_settings: settingsValidator,
  build_layout: settingsLayoutBuilder,
  default_values: {
    nr_queue_bot_state: "disabled",
    nr_queue_bot_artist_name: "Queue Bot",
    nr_queue_bot_pause_track_name: "Pause",
    nr_queue_bot_standby_track_name: "Standby",
  },
};
