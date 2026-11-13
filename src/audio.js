// ============================================================================
// Procedural WebAudio Engine: Dynamic Cartoon BGM + Juicy Polyphonic SFX
// ============================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;
    this.muted = false;
    this.bgmVolume = 0.36;
    this.sfxVolume = 0.68;

    this.lastPlayed = {};
    this.xpCombo = 0;
    this.lastXpTime = 0;

    // BGM sequencer state
    this.bgmPlaying = false;
    this.bgmMode = 'normal'; // 'normal' | 'boss' | 'fever' | 'menu'
    this.step = 0;
    this.nextNoteTime = 0;
    this.timerId = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 18;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.14;

    this.master = this.ctx.createGain();
    this.bgmGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.updateVolumes();

    this.bgmGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(comp);
    comp.connect(this.ctx.destination);

    // Pre-generate 1 second white noise buffer
    const sr = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, sr, sr);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < sr; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  updateVolumes() {
    if (!this.master || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, t, 0.02);
    this.bgmGain.gain.setTargetAtTime(this.bgmVolume, t, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume, t, 0.02);
  }

  setMuted(m) {
    this.muted = m;
    this.updateVolumes();
  }

  _canPlay(id, minGapSec) {
    if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return false;
    const now = this.ctx.currentTime;
    if (this.lastPlayed[id] && now - this.lastPlayed[id] < minGapSec) return false;
    this.lastPlayed[id] = now;
    return true;
  }

  _tone(type, fStart, fEnd, dur, vol = 0.25, delay = 0, dest = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, fStart), t);
    if (fEnd && fEnd !== fStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.012, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(dest || this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _noise(dur, vol = 0.2, filterType = 'bandpass', freq = 1200, q = 1.2, delay = 0, dest = null) {
    if (!this.ctx || !this.noiseBuffer) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const flt = this.ctx.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.setValueAtTime(freq, t);
    flt.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(dest || this.sfxGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  play(name) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    const p = rand(0.93, 1.08);

    switch (name) {
      case 'hit':
        if (!this._canPlay('hit', 0.038)) return;
        this._tone('triangle', 220 * p, 85 * p, 0.065, 0.22);
        this._noise(0.04, 0.12, 'bandpass', 1800 * p, 1.4);
        break;

      case 'crit':
        if (!this._canPlay('crit', 0.055)) return;
        this._tone('sawtooth', 520 * p, 160 * p, 0.11, 0.24);
        this._tone('sine', 980 * p, 1420 * p, 0.09, 0.18, 0.01);
        this._noise(0.065, 0.2, 'highpass', 2200, 1.0);
        break;

      case 'slap': // Salted fish crispy slap!
        if (!this._canPlay('slap', 0.075)) return;
        this._noise(0.09, 0.30, 'bandpass', 1550 * p, 1.8);
        this._tone('triangle', 340 * p, 110 * p, 0.11, 0.28);
        break;

      case 'wok': // Cast-iron wok metallic CLANG!
        if (!this._canPlay('wok', 0.075)) return;
        this._tone('triangle', 540 * p, 515 * p, 0.20, 0.25);
        this._tone('sine', 812 * p, 770 * p, 0.18, 0.20);
        this._tone('square', 1195 * p, 1120 * p, 0.11, 0.10);
        break;

      case 'honk': // Chaotic Goose HONK!
        if (!this._canPlay('honk', 0.18)) return;
        {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const flt = this.ctx.createBiquadFilter();
          const g = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc2.type = 'square';
          osc.frequency.setValueAtTime(410 * p, t);
          osc.frequency.linearRampToValueAtTime(510 * p, t + 0.06);
          osc.frequency.linearRampToValueAtTime(370 * p, t + 0.22);
          osc2.frequency.setValueAtTime(416 * p, t);
          flt.type = 'bandpass';
          flt.frequency.value = 1050;
          flt.Q.value = 3.6;
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.42, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
          osc.connect(flt);
          osc2.connect(flt);
          flt.connect(g);
          g.connect(this.sfxGain);
          osc.start(t);
          osc2.start(t);
          osc.stop(t + 0.26);
          osc2.stop(t + 0.26);
        }
        break;

      case 'chicken': // Rubber chicken harmonic squawk!
        if (!this._canPlay('chicken', 0.12)) return;
        {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const flt = this.ctx.createBiquadFilter();
          const g = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(680 * p, t);
          osc.frequency.linearRampToValueAtTime(920 * p, t + 0.05);
          osc.frequency.exponentialRampToValueAtTime(390 * p, t + 0.28);
          flt.type = 'bandpass';
          flt.frequency.setValueAtTime(1450, t);
          flt.Q.value = 4.2;
          g.gain.setValueAtTime(0.36, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
          osc.connect(flt);
          flt.connect(g);
          g.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.32);
        }
        break;

      case 'magic':
        if (!this._canPlay('magic', 0.055)) return;
        this._tone('sine', 660 * p, 1180 * p, 0.09, 0.16);
        this._tone('triangle', 990 * p, 1480 * p, 0.07, 0.10, 0.015);
        break;

      case 'zap':
        if (!this._canPlay('zap', 0.06)) return;
        this._tone('sawtooth', 880 * p, 240 * p, 0.08, 0.15);
        this._noise(0.055, 0.14, 'highpass', 3000, 1.5);
        break;

      case 'keyboom':
        if (!this._canPlay('keyboom', 0.09)) return;
        this._noise(0.025, 0.26, 'bandpass', 3600 * p, 2.5);
        this._tone('sine', 165 * p, 42, 0.22, 0.35, 0.015);
        this._noise(0.14, 0.22, 'lowpass', 650, 1.0, 0.02);
        break;

      case 'boba':
        if (!this._canPlay('boba', 0.055)) return;
        this._tone('sine', 320 * p, 620 * p, 0.065, 0.20);
        break;

      case 'laser':
        if (!this._canPlay('laser', 0.12)) return;
        this._tone('sawtooth', 1250 * p, 310 * p, 0.18, 0.18);
        this._tone('sine', 620 * p, 920 * p, 0.16, 0.15);
        break;

      case 'dash':
        if (!this._canPlay('dash', 0.1)) return;
        this._noise(0.14, 0.24, 'bandpass', 1100, 0.9);
        this._tone('triangle', 260, 580, 0.13, 0.22);
        break;

      case 'xp': {
        if (!this._canPlay('xp', 0.028)) return;
        const now = this.ctx.currentTime;
        if (now - this.lastXpTime > 0.48) this.xpCombo = 0;
        this.lastXpTime = now;
        const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0];
        const freq = scale[Math.min(this.xpCombo, scale.length - 1)];
        this.xpCombo++;
        this._tone('sine', freq, freq * 1.02, 0.085, 0.16);
        this._tone('triangle', freq * 2, freq * 2, 0.05, 0.05);
        break;
      }

      case 'coin':
        if (!this._canPlay('coin', 0.04)) return;
        this._tone('sine', 987.77, 987.77, 0.07, 0.18);
        this._tone('sine', 1318.51, 1318.51, 0.14, 0.20, 0.055);
        break;

      case 'heal':
        if (!this._canPlay('heal', 0.12)) return;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
          this._tone('triangle', f, f * 1.01, 0.14, 0.2, idx * 0.045);
        });
        break;

      case 'hurt':
        if (!this._canPlay('hurt', 0.12)) return;
        this._tone('sawtooth', 190, 70, 0.18, 0.34);
        this._noise(0.12, 0.25, 'lowpass', 900, 1.2);
        break;

      case 'pop':
        if (!this._canPlay('pop', 0.032)) return;
        this._tone('sine', 280 * p, 520 * p, 0.055, 0.14);
        break;

      case 'explode':
        if (!this._canPlay('explode', 0.08)) return;
        this._tone('sine', 140 * p, 36, 0.28, 0.38);
        this._noise(0.24, 0.30, 'lowpass', 820, 0.9);
        break;

      case 'levelup':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
          this._tone('triangle', f, f, 0.18, 0.24, i * 0.055);
          this._tone('sine', f * 0.5, f * 0.5, 0.18, 0.14, i * 0.055);
        });
        break;

      case 'evo':
        [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093.0].forEach((f, i) => {
          this._tone('triangle', f, f * 1.01, 0.26, 0.26, i * 0.06);
          this._tone('sawtooth', f * 0.5, f * 0.5, 0.22, 0.10, i * 0.06);
        });
        break;

      case 'roulette':
        this._tone('triangle', 600 + (this.step % 6) * 90, 620, 0.045, 0.18);
        break;

      case 'bossWarn':
        for (let i = 0; i < 3; i++) {
          this._tone('sawtooth', 440, 290, 0.24, 0.28, i * 0.28);
          this._tone('square', 220, 145, 0.24, 0.20, i * 0.28);
        }
        break;

      case 'click':
        this._tone('sine', 740, 980, 0.045, 0.16);
        break;
    }
  }

  startBgm(mode = 'normal') {
    this.init();
    if (!this.ctx) return;
    this.bgmMode = mode;
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.timerId = setInterval(() => this._scheduleBgm(), 40);
  }

  setBgmMode(mode) {
    this.bgmMode = mode;
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  _midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  _scheduleBgm() {
    if (!this.bgmPlaying || !this.ctx) return;
    const tempo =
      this.bgmMode === 'fever' ? 162 :
      this.bgmMode === 'boss' ? 148 :
      this.bgmMode === 'menu' ? 116 : 132;
    const stepDur = 60 / tempo / 4; // 16th note

    while (this.nextNoteTime < this.ctx.currentTime + 0.14) {
      this._playBgmStep(this.step, this.nextNoteTime, stepDur);
      this.nextNoteTime += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  _playBgmStep(s, t, dur) {
    if (this.muted || this.bgmVolume <= 0.01) return;

    // Quirky upbeat minor-pentatonic / bouncy cartoon adventure loop (64 16th-steps = 4 bars)
    const isBoss = this.bgmMode === 'boss';
    const isFever = this.bgmMode === 'fever';

    // Kick on 0, 4, 8, 12 (four-on-the-floor or bouncy syncopation)
    if (s % 4 === 0 || (isBoss && s % 8 === 6)) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(125, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.09);
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
      osc.connect(g);
      g.connect(this.bgmGain);
      osc.start(t);
      osc.stop(t + 0.11);
    }

    // Crisp hi-hat / snare
    if (s % 4 === 2) {
      this._bgmNoise(t, 0.035, 0.07, 5500);
    }
    if (s % 8 === 4) {
      this._bgmNoise(t, 0.075, 0.13, 1900);
    }

    // Bassline (bouncy octave groove)
    const bassRoots = isBoss
      ? [38, 38, 41, 43, 38, 38, 46, 45] // D minor intense boss groove
      : isFever
      ? [48, 52, 55, 57, 48, 52, 55, 60] // C major euphoric fever
      : [45, 45, 48, 50, 41, 41, 43, 45]; // A minor playful cartoon groove

    if (s % 2 === 0) {
      const barIdx = Math.floor(s / 8);
      const octaveBump = (s % 4 === 2) ? 12 : 0;
      const note = bassRoots[barIdx] + octaveBump;
      this._bgmNote('triangle', this._midiToFreq(note), t, dur * 1.45, 0.20);
    }

    // Playful marimba / chiptune lead melody
    const normalMelody = [
      69, 0, 72, 76, 74, 0, 72, 69,   72, 0, 76, 79, 81, 0, 79, 76,
      69, 0, 72, 76, 81, 0, 79, 76,   74, 76, 74, 72, 69, 0, 64, 67,
      65, 0, 69, 72, 74, 0, 72, 69,   67, 0, 71, 74, 76, 0, 74, 71,
      69, 72, 76, 81, 79, 76, 72, 74, 69, 0, 81, 0, 69, 0, 0, 0
    ];
    const bossMelody = [
      62, 65, 69, 62, 74, 0, 73, 0,   62, 65, 70, 69, 67, 65, 64, 65,
      62, 65, 69, 74, 77, 0, 76, 74,  73, 0, 76, 0, 74, 70, 69, 65,
      62, 0, 74, 74, 73, 0, 74, 0,    77, 76, 74, 70, 69, 67, 65, 64,
      62, 65, 69, 74, 79, 77, 74, 69, 73, 0, 76, 0, 74, 0, 62, 0
    ];
    const feverMelody = [
      72, 76, 79, 84, 81, 79, 76, 79, 74, 77, 81, 86, 84, 81, 79, 76,
      72, 76, 79, 84, 88, 86, 84, 79, 81, 84, 86, 88, 84, 0, 79, 0,
      72, 76, 79, 84, 81, 79, 76, 79, 74, 79, 83, 86, 88, 86, 83, 79,
      84, 0, 84, 86, 88, 0, 86, 84,   81, 79, 76, 74, 72, 0, 84, 0
    ];

    const mel = isBoss ? bossMelody : isFever ? feverMelody : normalMelody;
    const mNote = mel[s];
    if (mNote > 0) {
      this._bgmNote(isBoss ? 'sawtooth' : 'square', this._midiToFreq(mNote), t, dur * 1.5, isBoss ? 0.085 : 0.075);
      this._bgmNote('sine', this._midiToFreq(mNote + 12), t, dur * 0.8, 0.045);
    }
  }

  _bgmNote(type, freq, t, dur, vol) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + dur + 0.015);
  }

  _bgmNoise(t, dur, vol, freq) {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'highpass';
    flt.frequency.setValueAtTime(freq, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(this.bgmGain);
    src.start(t);
    src.stop(t + dur + 0.01);
  }
}

const SFX = new SoundEngine();
