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

interface BuiltSettings {
  group: GroupSetting;
  has_error: boolean;
}

const settingsLayoutBuilder: SettingsLayoutBuilder<ExtensionSettings> = (values, has_error) => {
  const queueBotSettings = buildQueueBotSettings(values, has_error);
  has_error = has_error || queueBotSettings.has_error;
  const audioInputSettings = buildAudioInputSettings(values, has_error);
  has_error = has_error || audioInputSettings.has_error;
  const airplaySettings = buildAirplaySettings(values, has_error);
  has_error = has_error || airplaySettings.has_error;
  return {
    values,
    layout: [queueBotSettings.group, audioInputSettings.group, airplaySettings.group],
    has_error,
  };
};

const buildQueueBotSettings = (values: ExtensionSettings, has_error: boolean): BuiltSettings => {
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
  const group: GroupSetting = {
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
    group.items.push(queueBotArtistName, queueBotPauseTrackName, queueBotStandbyTrackName);
  }
  return {
    group,
    has_error,
  };
};

const buildAudioInputSettings = (values: ExtensionSettings, has_error: boolean): BuiltSettings => {
  const audioInputActivation: DropdownSetting = {
    type: "dropdown",
    setting: "nr_audio_input_state",
    title: "enable Audio Input feature",
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
  const group: GroupSetting = {
    type: "group",
    title: "Audio Input",
    items: [audioInputActivation],
  };
  if (values.nr_audio_input_state === "enabled") {
    const audioInputStreamUrl: StringSetting = {
      type: "string",
      title: "audio input stream url",
      setting: "nr_audio_input_stream_url",
    };
    has_error = validateMandatorySetting(audioInputStreamUrl, values) || has_error;
    const audioInputZones: DropdownSetting = {
      type: "dropdown",
      title: "default zone for audio input",
      setting: "nr_audio_input_default_zone",
      values: values.nr_audio_input_zones.map((zoneDropdown) => ({
        title: zoneDropdown.zone_name,
        value: zoneDropdown.zone_id,
      })),
    };
    has_error = validateMandatorySetting(audioInputZones, values) || has_error;
    group.items.push(audioInputStreamUrl, audioInputZones);
  }
  return {
    group,
    has_error,
  };
};

const buildAirplaySettings = (values: ExtensionSettings, has_error: boolean) => {
  const airplayActivation: DropdownSetting = {
    type: "dropdown",
    setting: "nr_airplay_state",
    title: "enable Airplay feature",
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
  const group: GroupSetting = {
    type: "group",
    title: "Airplay",
    items: [airplayActivation],
  };
  if (values.nr_airplay_state === "enabled") {
    const airplayHost: StringSetting = {
      type: "string",
      title: "airplay stream url",
      setting: "nr_airplay_stream_url",
    };
    has_error = validateMandatorySetting(airplayHost, values) || has_error;
    const airplayZones: DropdownSetting = {
      type: "dropdown",
      title: "airplay zone",
      setting: "nr_airplay_zone",
      values: values.nr_airplay_zones.map((zoneDropdown) => ({
        title: zoneDropdown.zone_name,
        value: zoneDropdown.zone_id,
      })),
    };
    has_error = validateMandatorySetting(airplayZones, values) || has_error;
    group.items.push(airplayHost, airplayZones);
  }
  return {
    group,
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
  if (settings_to_save.nr_audio_input_stream_url === "") {
    has_error = true;
  }
  if (settings_to_save.nr_audio_input_default_zone === "") {
    has_error = true;
  }
  if (settings_to_save.nr_airplay_stream_url === "") {
    has_error = true;
  }
  if (settings_to_save.nr_airplay_zone === "") {
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
    nr_audio_input_state: "disabled",
    nr_audio_input_stream_url: "",
    nr_audio_input_default_zone: "",
    nr_audio_input_zones: [],
    nr_airplay_state: "disabled",
    nr_airplay_stream_url: "",
    nr_airplay_zone: "",
    nr_airplay_zones: [],
  },
};
