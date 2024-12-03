import { roonMock } from "./roon-extension.mock";

import { ExtensionSettings, RoonExtension } from "@model";
import { settingsOptions } from "./roon-extension-settings";

describe("roon-extension-settings test suite", () => {
  const roonExtension = roonMock as unknown as RoonExtension<ExtensionSettings>;
  it("settingsOptions should produce expected layout if Queue Bot is disabled", () => {
    const settingsLayout = settingsOptions.build_layout(DEFAULT_VALUES, false, roonExtension);
    expect(settingsLayout.layout).toHaveLength(1);
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
    expect(settingsLayout.layout).toHaveLength(1);
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
      },
      false,
      roonExtension
    );
    expect(settingsLayout.layout).toHaveLength(1);
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
  });
});

const DEFAULT_VALUES: ExtensionSettings = {
  nr_queue_bot_state: "disabled",
  nr_queue_bot_artist_name: "Queue Bot",
  nr_queue_bot_pause_track_name: "Pause",
  nr_queue_bot_standby_track_name: "Standby",
};
