#!/usr/bin/liquidsoap

settings.log.level := 3
settings.log.file := false

airplay_in = input.external.rawaudio(
  "cat /tmp/shairport-sync-audio",
  samplerate = 44100,
  channels = 2,
  buffer = 0.1,
  max = 1.0,
  restart = true
)

safe_source = fallback(track_sensitive=false, [airplay_in, blank()])

output.harbor(
  %ogg(%flac(compression=1, bits_per_sample=16)),
  safe_source,
  port = 8000,
  mount = "/airplay",
  format = "application/ogg",
  fallible = true
)
