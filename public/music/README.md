# Background music

The site plays background music from this folder when a playlist is present,
and falls back to a built-in synthesised piano when it isn't. Nothing here is
required for the site to work.

## Adding tracks

1. Put audio files in this folder (`.mp3` or `.m4a`, 128–192 kbps is plenty for
   ambient background — keep each file under ~4 MB so it doesn't compete with
   the page for bandwidth).
2. Create `playlist.json` next to them:

```json
{
  "tracks": [
    "track-one.mp3",
    "track-two.mp3",
    "track-three.mp3"
  ]
}
```

The player walks the list in order and wraps around at the end, so the whole
playlist repeats indefinitely. Delete `playlist.json` to go back to the
synthesised piano.

## Licensing — read before adding anything

This is a commercial business website. Playing a recording here is a **public
performance**, which is not covered by a personal Spotify/Apple Music
subscription, and it is not covered by buying the song. Uploading a commercial
release (or a cover of one) exposes the clinic to takedowns and statutory
damages.

Requested tracks like *CHIHIRO*, *Northern Attitude*, *Heat Waves* and
*Adore You* cannot be used, in original or cover form, without licensing them
directly from the rights holders — which for major-label songs is generally not
available to a small business at reasonable cost.

Routes that are safe and give you the same calm-piano feel:

- **Subscription libraries** — Epidemic Sound, Artlist, Soundstripe, Musicbed.
  A single subscription (roughly $10–25/month) covers commercial use on a
  business website, and all of them have large solo-piano / ambient catalogues.
  This is the usual answer for a clinic waiting room.
- **Public-domain classical, freely-licensed recordings** — Musopen
  (musopen.org) hosts CC0 / public-domain recordings of Chopin nocturnes,
  Satie's *Gymnopédies*, Debussy's *Clair de Lune*. Both the composition and
  the specific recording are free to use. Closest thing to "free and legal".
- **Creative Commons** — ccMixter, Free Music Archive. Check each track's
  licence individually; prefer CC0 or CC-BY, and avoid CC-BY-NC on a commercial
  clinic site. Attribution, where required, goes in the site footer.
- **Commission a cover** — a local pianist can record original arrangements.
  Note that a cover of a copyrighted song still needs a mechanical licence for
  the underlying composition; only the recording becomes yours.

If you buy a subscription track, keep the licence receipt — the libraries issue
a licence ID per download, which is what you'd show if a claim is ever raised.
