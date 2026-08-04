// Background music with two sources, in priority order:
//
//   1. Real audio files listed in /music/playlist.json (see public/music/README.md).
//      This is the intended production path — drop licensed tracks in and they
//      play on repeat, gapless-ish, in order.
//   2. A synthesised ambient piano, used when no playlist is present so the
//      feature still works out of the box with zero copyright exposure and
//      zero download weight.
//
// Copyrighted commercial recordings cannot be bundled here. See the README in
// public/music for licensing routes that are safe for a business website.

const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99
};

// Waiting-room music, not a jingle. The earlier version had a note on every
// beat in a high register, which is exactly the shape of an ice-cream-van
// tune. What makes a space feel calm instead is: slow harmonic movement, notes
// low and sustained, long gaps, and a melody that only occasionally appears
// rather than marching along on the beat.
//
// So: one chord per 8-second bar, voiced low and rolled slowly like a held
// pedal; at most one melody note per bar, placed off the downbeat; and a
// gentle ii–V–I-ish drift in C that never resolves hard.
//
// `melody: []` means the bar is left to breathe — the silence is deliberate.
const PROGRESSION = [
  { chord: ['C3', 'G3', 'C4', 'E4'], melody: [{ note: 'G4', at: 2.4 }] },
  { chord: ['A3', 'E4', 'A4'],       melody: [] },
  { chord: ['F3', 'C4', 'F4', 'A4'], melody: [{ note: 'C5', at: 3.1 }] },
  { chord: ['G3', 'D4', 'G4'],       melody: [] },
  { chord: ['E3', 'B3', 'E4', 'G4'], melody: [{ note: 'B4', at: 2.0 }] },
  { chord: ['F3', 'C4', 'F4'],       melody: [] },
  { chord: ['D3', 'A3', 'D4', 'F4'], melody: [{ note: 'A4', at: 3.4 }] },
  { chord: ['G3', 'D4', 'G4', 'B3'], melody: [] }
];

// 8s per bar: the whole loop is ~64s, slow enough that it doesn't register as
// a repeating tune while someone reads the page.
const BAR = 8.0;
// Seconds between successive notes of a rolled chord.
const ROLL = 0.5;

let ctx = null;
let masterGain = null;
let reverbSend = null;
let loopTimer = null;
let playing = false;

let audioEl = null;
let playlist = null;
let trackIndex = 0;
let playlistChecked = false;

export function getAudioContext() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.16;
    masterGain.connect(ctx.destination);

    // Short synthetic impulse response — gives the notes a room to sit in so
    // they read as "piano in a space" rather than a bare oscillator.
    const seconds = 2.2;
    const len = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    reverbSend = ctx.createGain();
    // Wetter than before — more room, fewer distinct note attacks.
    reverbSend.gain.value = 0.45;
    reverbSend.connect(convolver);
    convolver.connect(masterGain);
  }
  return ctx;
}

// One piano-ish note: fundamental plus two quieter harmonics, struck with a
// fast attack and a long exponential decay, brightened then dampened by a
// filter envelope the way a real string loses its upper partials.
function playNote(freq, when, velocity = 1, dur = 2.6) {
  const voice = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Darker than a real piano hammer. Keeping the upper partials in made every
  // note read as a bright "plink"; rolling the filter down to around the 3rd
  // harmonic is what turns it into something you stop noticing.
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(2600, freq * 4.5), when);
  filter.frequency.exponentialRampToValueAtTime(Math.max(240, freq * 1.5), when + dur * 0.6);
  filter.Q.value = 0.4;

  // ~90ms attack rather than 6ms: a soft swell instead of a struck string.
  voice.gain.setValueAtTime(0.0001, when);
  voice.gain.exponentialRampToValueAtTime(Math.max(0.03, 0.42 * velocity), when + 0.09);
  voice.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  const partials = [
    { mult: 1, gain: 1.0, type: 'sine' },
    { mult: 2, gain: 0.16, type: 'sine' },
    { mult: 3, gain: 0.05, type: 'triangle' }
  ];

  const oscs = partials.map(p => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = p.type;
    osc.frequency.value = freq * p.mult;
    // A few cents of detune keeps it from sounding perfectly synthetic.
    osc.detune.value = (Math.random() - 0.5) * 6;
    g.gain.value = p.gain;
    osc.connect(g);
    g.connect(filter);
    osc.start(when);
    osc.stop(when + dur + 0.1);
    return osc;
  });

  filter.connect(voice);
  voice.connect(masterGain);
  voice.connect(reverbSend);
  return oscs;
}

function scheduleLoop() {
  if (!playing || !ctx) return;
  const startAt = ctx.currentTime + 0.15;

  PROGRESSION.forEach((bar, barIndex) => {
    const barTime = startAt + barIndex * BAR;
    // Chord rolled slowly and held — long decay so bars overlap and blur into
    // each other instead of landing as separate events.
    bar.chord.forEach((note, i) => {
      playNote(NOTES[note], barTime + i * ROLL, 0.34, 7.5);
    });
    // Melody, when there is one, sits quieter than the chord under it. A
    // background track that pokes above its own accompaniment draws attention,
    // which is the opposite of what this is for.
    bar.melody.forEach(m => {
      playNote(NOTES[m.note], barTime + m.at, 0.26, 5.0);
    });
  });

  const loopMs = PROGRESSION.length * BAR * 1000;
  loopTimer = setTimeout(scheduleLoop, loopMs);
}

async function loadPlaylist() {
  if (playlistChecked) return playlist;
  playlistChecked = true;
  try {
    const res = await fetch('/music/playlist.json', { cache: 'no-cache' });
    if (!res.ok) return null;
    const json = await res.json();
    const tracks = Array.isArray(json) ? json : json.tracks;
    if (Array.isArray(tracks) && tracks.length) {
      playlist = tracks.filter(t => typeof t === 'string' || t?.src);
      return playlist;
    }
  } catch {
    // No playlist deployed — fall through to the synth.
  }
  return null;
}

function trackUrl(entry) {
  const src = typeof entry === 'string' ? entry : entry.src;
  return src.startsWith('http') || src.startsWith('/') ? src : `/music/${src}`;
}

function startPlaylist() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.volume = 0.35;
    audioEl.preload = 'none';
    // Advance through the list, wrapping at the end — this is the "on repeat"
    // behaviour: the whole playlist loops forever, not just one track.
    audioEl.addEventListener('ended', () => {
      trackIndex = (trackIndex + 1) % playlist.length;
      audioEl.src = trackUrl(playlist[trackIndex]);
      audioEl.play().catch(() => {});
    });
    audioEl.addEventListener('error', () => {
      // A bad file shouldn't kill playback; skip to the next one.
      if (!playing || !playlist?.length) return;
      trackIndex = (trackIndex + 1) % playlist.length;
      audioEl.src = trackUrl(playlist[trackIndex]);
      audioEl.play().catch(() => {});
    });
  }
  if (!audioEl.src) audioEl.src = trackUrl(playlist[trackIndex]);
  audioEl.play().catch(() => {});
}

export async function startMusic() {
  if (playing) return;
  playing = true;

  const list = await loadPlaylist();
  if (!playing) return; // toggled off while the manifest was loading
  if (list && list.length) {
    startPlaylist();
    return;
  }

  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  scheduleLoop();
}

export function stopMusic() {
  playing = false;
  if (loopTimer) clearTimeout(loopTimer);
  loopTimer = null;
  if (audioEl) audioEl.pause();
  // Silence any synth voices still ringing out.
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    setTimeout(() => {
      if (!playing && masterGain) masterGain.gain.value = 0.16;
    }, 400);
  }
}

export function isPlaying() {
  return playing;
}

// Browsers suspend a hidden tab's AudioContext and throttle its timers, which
// would otherwise leave music switched "on" but silent after a tab switch.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !playing) return;
    if (audioEl && audioEl.src) {
      audioEl.play().catch(() => {});
      return;
    }
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!loopTimer) scheduleLoop();
  });
}
