#!/usr/bin/liquidsoap

settings.log.level := 3
settings.log.file := false

airplay_in = input.external.rawaudio(
  "cat /tmp/shairport-sync-audio",
  samplerate = 44100,
  channels = 2,
  buffer = 0.2,
  max = 0.5,
  restart = true
)

safe_source = fallback(track_sensitive=false, [airplay_in, blank()])

roon_airplay_port = int_of_string(environment.get(default = "8000", "ROON_AIRPLAY_PORT"))

output.harbor(
  %ogg(%flac(compression=1, bits_per_sample=16)),
  safe_source,
  port = roon_airplay_port,
  mount = "/airplay",
  format = "application/ogg",
  fallible = true
)
