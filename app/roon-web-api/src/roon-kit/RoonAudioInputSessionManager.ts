import {
  AudioInputSessionManager,
  ExtensionSettings,
  RoonApiAudioInputSession,
  RoonApiAudioInputSessionListener,
  RoonAudioInputTrackInfo,
  RoonExtension,
} from "@nihilux/roon-web-model";

export class RoonAudioInputSessionManager implements AudioInputSessionManager {
  private readonly _roonExtension: RoonExtension<ExtensionSettings>;
  private readonly _currentSessions: Map<string, {
    url: string;
    session: RoonApiAudioInputSession;
  }>;

  constructor(roonExtension: RoonExtension<any>) {
    this._roonExtension = roonExtension;
    this._currentSessions = new Map();
  }

  public async end_session(zone_id: string): Promise<void> {
    const currentSession = this._currentSessions.get(zone_id);
    currentSession?.session.end();
  }

  public has_session(zone_id: string): boolean {
    return this._currentSessions.has(zone_id);
  }

  public async play(zone_id: string, url: string): Promise<void> {
    const currentSession = this._currentSessions.get(zone_id);
    await currentSession?.session.end();
    const server = await this._roonExtension.get_core();
    return server.services.RoonApiAudioInput.begin_session(
      {
        zone_id,
        display_name: "Roon Audio Input",
        icon_url: "",
      },
      this.sessionListener(zone_id)
    ).then((session) => {
      this._currentSessions.set(zone_id, {
        session,
        url,
      });
    });
  }

  private sessionListener(zone_id: string, info?: RoonAudioInputTrackInfo): RoonApiAudioInputSessionListener {
    return (event, body: { session_id: string }) => {
      const currentSession = this._currentSessions.get(zone_id);
      if (currentSession === undefined) {
        return;
      }
      switch (event) {
        case "SessionBegan":
          currentSession.session.session_id = body.session_id;
          void this._roonExtension.get_core()
            .then(async (server) => {
              await server.services.RoonApiAudioInput.update_transport_controls({
                session_id: currentSession.session.session_id,
                controls: {
                  is_next_allowed: false,
                  is_previous_allowed: false,
                },
              });
              info = info ?? {
                is_seek_allowed: false,
                is_pause_allowed: true,
                one_line: {
                  line1: "Audio Input",
                },
                two_line: {
                  line1: "Audio Input",
                  line2: "roon web stack",
                },
                three_line: {
                  line1: "Audio Input",
                  line2: "roon web stack",
                  line3: currentSession.url,
                },
              };
              return server.services.RoonApiAudioInput.play(
                {
                  session_id: currentSession.session.session_id,
                  type: "channel",
                  slot: "play",
                  media_url: currentSession.url,
                  info,
                },
                (event, body) => {
                  switch (event.name) {
                    case "EndedNaturally":
                    case "MediaError":
                    case "ZoneLost":
                    case "ZoneNotFound":
                      void this.end_session(zone_id).catch((error) => {
                        // do nothing
                      });
                      break;
                  }
                }
              );
            })
            .catch((error) => {
              // do nothing
            });
          break;
        case "SessionEnded":
          this._currentSessions.delete(zone_id);
          break;
        case "ZoneNotFound":
        case "ZoneLost":
          currentSession.session.end().catch((error) => {
            // do nothing
          });
      }
    };
  }

  public async update_track_info(zone_id: string, info: RoonAudioInputTrackInfo): Promise<void> {
    const currentSession = this._currentSessions.get(zone_id);
    if (currentSession !== undefined) {
      const server = await this._roonExtension.get_core();
      return server.services.RoonApiAudioInput.update_track_info({
        session_id: currentSession.session.session_id,
        info,
      });
    }
  }
}
