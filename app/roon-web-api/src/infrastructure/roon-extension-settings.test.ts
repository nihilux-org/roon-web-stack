import { roonMock } from "./roon-extension.mock";

import { ExtensionSettings, RoonExtension } from "@nihilux/roon-web-model";
import { settingsOptions } from "./roon-extension-settings";

describe("roon-extension-settings test suite", () => {
  const roonExtension = roonMock as unknown as RoonExtension<ExtensionSettings>;
  it("settingsOptions should produce expected layout if Queue Bot is disabled", () => {
    const settingsLayout = settingsOptions.build_layout(DEFAULT_VALUES, false, roonExtension);
    expect(settingsLayout.layout).toHaveLength(2);
    expect(settingsLayout.layout[0]).toEqual({
      type: "group",
      title: "Queue Bot",
      items: [
        {
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
        },
      ],
    });
  });

  it("settingsOptions should produce expected layout if Queue Bot is enabled", () => {
    const settingsLayout = settingsOptions.build_layout(
      {
        ...DEFAULT_VALUES,
        nr_queue_bot_state: "enabled",
      },
      false,
      roonExtension
    );
    expect(settingsLayout.layout).toHaveLength(2);
    expect(settingsLayout.layout[0]).toEqual({
      type: "group",
      title: "Queue Bot",
      items: [
        {
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
        },
        {
          type: "string",
          title: "artist name",
          setting: "nr_queue_bot_artist_name",
        },
        {
          type: "string",
          title: "pause action track name",
          setting: "nr_queue_bot_pause_track_name",
        },
        {
          type: "string",
          title: "standby action track name",
          setting: "nr_queue_bot_standby_track_name",
        },
      ],
    });
  });

  it("settingsOptions should produce expected layout if Queue Bot is enabled and some field are not populated", () => {
    const settingsLayout = settingsOptions.build_layout(
      {
        nr_queue_bot_state: "enabled",
        nr_queue_bot_artist_name: "",
        nr_queue_bot_pause_track_name: "",
        nr_queue_bot_standby_track_name: "",
        nr_audio_input_state: "disabled",
        nr_audio_input_stream_url: "",
        nr_audio_input_default_zone: "",
        nr_audio_input_zones: [],
      },
      false,
      roonExtension
    );
    expect(settingsLayout.layout).toHaveLength(2);
    expect(settingsLayout.layout[0]).toEqual({
      type: "group",
      title: "Queue Bot",
      items: [
        {
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
        },
        {
          type: "string",
          title: "artist name",
          setting: "nr_queue_bot_artist_name",
          error: "this field is required",
        },
        {
          type: "string",
          title: "pause action track name",
          setting: "nr_queue_bot_pause_track_name",
          error: "this field is required",
        },
        {
          type: "string",
          title: "standby action track name",
          setting: "nr_queue_bot_standby_track_name",
          error: "this field is required",
        },
      ],
    });
  });

  it("settingsOptions should produce expected layout if Audio Input is disabled", () => {
    const settingsLayout = settingsOptions.build_layout(DEFAULT_VALUES, false, roonExtension);
    expect(settingsLayout.layout).toHaveLength(2);
    expect(settingsLayout.layout[1]).toEqual({
      type: "group",
      title: "Audio Input",
      items: [
        {
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
        },
      ],
    });
  });

  it("settingsOptions should produce expected layout if Audio Input is enabled", () => {
    const settingsLayout = settingsOptions.build_layout(
      {
        ...DEFAULT_VALUES,
        nr_audio_input_state: "enabled",
      },
      false,
      roonExtension
    );
    expect(settingsLayout.layout).toHaveLength(2);
    expect(settingsLayout.layout[1]).toEqual({
      type: "group",
      title: "Audio Input",
      items: [
        {
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
        },
        {
          type: "string",
          title: "audio input stream url",
          setting: "nr_audio_input_stream_url",
        },
        {
          type: "dropdown",
          title: "default zone for audio input",
          setting: "nr_audio_input_default_zone",
          values: [
            {
              title: "zone_name",
              value: "zone_id",
            },
            {
              title: "other_zone_name",
              value: "other_zone_id",
            },
          ],
        },
      ],
    });
  });

  it("settingsOptions should produce expected layout if Audio Input is enabled and some field are not populated", () => {
    const settingsLayout = settingsOptions.build_layout(
      {
        nr_queue_bot_state: "disabled",
        nr_queue_bot_artist_name: "",
        nr_queue_bot_pause_track_name: "",
        nr_queue_bot_standby_track_name: "",
        nr_audio_input_state: "enabled",
        nr_audio_input_stream_url: "",
        nr_audio_input_default_zone: "",
        nr_audio_input_zones: [
          {
            zone_id: "zone_id",
            zone_name: "zone_name",
          },
          {
            zone_id: "other_zone_id",
            zone_name: "other_zone_name",
          },
        ],
      },
      false,
      roonExtension
    );
    expect(settingsLayout.layout).toHaveLength(2);
    expect(settingsLayout.layout[1]).toEqual({
      type: "group",
      title: "Audio Input",
      items: [
        {
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
        },
        {
          type: "string",
          title: "audio input stream url",
          setting: "nr_audio_input_stream_url",
          error: "this field is required",
        },
        {
          type: "dropdown",
          title: "default zone for audio input",
          setting: "nr_audio_input_default_zone",
          error: "this field is required",
          values: [
            {
              title: "zone_name",
              value: "zone_id",
            },
            {
              title: "other_zone_name",
              value: "other_zone_id",
            },
          ],
        },
      ],
    });
  });

  it("settingsOptions should validate the mandatory fields if empty", () => {
    let validated = settingsOptions.validate_settings(
      {
        nr_queue_bot_artist_name: "",
      },
      roonExtension
    );
    expect(validated.has_error).toBe(true);
    validated = settingsOptions.validate_settings(
      {
        nr_queue_bot_standby_track_name: "",
      },
      roonExtension
    );
    expect(validated.has_error).toBe(true);

    validated = settingsOptions.validate_settings(
      {
        nr_queue_bot_pause_track_name: "",
      },
      roonExtension
    );
    expect(validated.has_error).toBe(true);

    validated = settingsOptions.validate_settings(
      {
        nr_audio_input_stream_url: "",
      },
      roonExtension
    );
    expect(validated.has_error).toBe(true);

    validated = settingsOptions.validate_settings(
      {
        nr_audio_input_default_zone: "",
      },
      roonExtension
    );
    expect(validated.has_error).toBe(true);
  });
});

const DEFAULT_VALUES: ExtensionSettings = {
  nr_queue_bot_state: "disabled",
  nr_queue_bot_artist_name: "Queue Bot",
  nr_queue_bot_pause_track_name: "Pause",
  nr_queue_bot_standby_track_name: "Standby",
  nr_audio_input_state: "disabled",
  nr_audio_input_stream_url: "http://stream.org/test",
  nr_audio_input_default_zone: "zone_id",
  nr_audio_input_zones: [
    {
      zone_id: "zone_id",
      zone_name: "zone_name",
    },
    {
      zone_id: "other_zone_id",
      zone_name: "other_zone_name",
    },
  ],
};
