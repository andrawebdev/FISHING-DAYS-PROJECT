// Web Audio API procedural atmospheric sound engine for Fishing Days
// Generates water lapping, birdsong, breeze wind, rain pitter-patter, crickets, reeling clicks, tension whining, splash, and catch fanfares

import { WeatherType, TimeOfDay } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Ambient nodes
  private waterNoiseNode: AudioNode | null = null;
  private rainNoiseNode: AudioNode | null = null;
  private windFilterNode: BiquadFilterNode | null = null;
  private birdsTimer: number | null = null;
  private cricketsTimer: number | null = null;

  // Reeling SFX
  private reelInterval: number | null = null;
  private tensionOsc: OscillatorNode | null = null;
  private tensionGain: GainNode | null = null;

  private weather: WeatherType = 'SUNNY';
  private timeOfDay: TimeOfDay = 'DAY';

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.startAmbientGenerators();
    } catch {
      console.warn('AudioContext not supported or blocked by autoplay policy.');
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public updateAtmosphere(weather: WeatherType, timeOfDay: TimeOfDay) {
    this.weather = weather;
    this.timeOfDay = timeOfDay;
    this.adjustAmbientNodes();
  }

  // --- AMBIENT SOUND GENERATION ---
  private startAmbientGenerators() {
    if (!this.ctx || !this.ambientGain) return;

    // 1. Water Lapping (Pink/Brown noise passed through modulated bandpass filter)
    this.waterNoiseNode = this.createWaterGenerator();

    // 2. Bird calls periodic scheduler
    this.scheduleBirdsong();

    // 3. Night crickets periodic scheduler
    this.scheduleCrickets();
  }

  private createWaterGenerator(): AudioNode | null {
    if (!this.ctx || !this.ambientGain) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration for soft water sound
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 2.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter simulating gentle water surface
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // LFO for wave swelling
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // gentle wave rhythm
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const waterGain = this.ctx.createGain();
    waterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(waterGain);
    waterGain.connect(this.ambientGain);
    whiteNoise.start();

    return waterGain;
  }

  private scheduleBirdsong() {
    const playNext = () => {
      const isDaytime = this.timeOfDay === 'MORNING' || this.timeOfDay === 'DAY' || this.timeOfDay === 'AFTERNOON';
      const isGoodWeather = this.weather === 'SUNNY' || this.weather === 'CLOUDY';

      if (isDaytime && isGoodWeather && !this.isMuted) {
        this.playBirdChirp();
      }

      // Schedule next chirp in 4 to 11 seconds
      const delay = 4000 + Math.random() * 7000;
      this.birdsTimer = window.setTimeout(playNext, delay);
    };

    playNext();
  }

  private playBirdChirp() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 2200 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, now + 0.22);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  private scheduleCrickets() {
    const playNext = () => {
      const isNight = this.timeOfDay === 'NIGHT' || this.timeOfDay === 'SUNSET';
      if (isNight && this.weather !== 'HEAVY_RAIN' && !this.isMuted) {
        this.playCricketPulse();
      }
      const delay = 1200 + Math.random() * 1500;
      this.cricketsTimer = window.setTimeout(playNext, delay);
    };

    playNext();
  }

  private playCricketPulse() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(4500, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  private adjustAmbientNodes() {
    if (!this.ctx || !this.ambientGain) return;
    // When raining or heavy rain, we can adjust procedural rain sound
    if (this.weather === 'RAIN' || this.weather === 'HEAVY_RAIN') {
      if (!this.rainNoiseNode) {
        this.rainNoiseNode = this.createRainGenerator(this.weather === 'HEAVY_RAIN' ? 0.35 : 0.15);
      }
    } else {
      if (this.rainNoiseNode) {
        try {
          (this.rainNoiseNode as GainNode).gain.setValueAtTime(0, this.ctx.currentTime);
        } catch {}
        this.rainNoiseNode = null;
      }
    }
  }

  private createRainGenerator(volume: number): AudioNode | null {
    if (!this.ctx || !this.ambientGain) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    whiteNoise.start();

    return gain;
  }

  // --- SFX: CASTING & WATER ---
  public playCastWhoosh() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playBobberSplash() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Low water pop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);

    // High droplet water splash
    const drop = this.ctx.createOscillator();
    const dropGain = this.ctx.createGain();
    drop.type = 'sine';
    drop.frequency.setValueAtTime(850, now);
    drop.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
    dropGain.gain.setValueAtTime(0.2, now);
    dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    drop.connect(dropGain);
    dropGain.connect(this.sfxGain);
    drop.start(now);
    drop.stop(now + 0.15);
  }

  public playNibble() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.06);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playBiteAlert() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Crisp splash
    this.playBobberSplash();

    // Alert ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playHookSuccess() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25]; // A Major triad snap
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.2, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.22);
    });
  }

  // --- REELING RATCHET SFX ---
  public startReelingSound() {
    if (this.reelInterval !== null || !this.ctx || this.isMuted) return;
    this.resume();
    this.playReelClick();
    this.reelInterval = window.setInterval(() => {
      this.playReelClick();
    }, 90);
  }

  public stopReelingSound() {
    if (this.reelInterval !== null) {
      clearInterval(this.reelInterval);
      this.reelInterval = null;
    }
  }

  private playReelClick() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const clickFreq = 1200 + Math.random() * 400;
    osc.frequency.setValueAtTime(clickFreq, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // --- TENSION ALARM SFX ---
  public updateTensionSound(tensionRatio: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    if (tensionRatio > 0.78) {
      if (!this.tensionOsc) {
        this.tensionOsc = this.ctx.createOscillator();
        this.tensionGain = this.ctx.createGain();
        this.tensionOsc.type = 'sawtooth';
        this.tensionOsc.frequency.setValueAtTime(600, this.ctx.currentTime);
        this.tensionGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

        this.tensionOsc.connect(this.tensionGain);
        this.tensionGain.connect(this.sfxGain);
        this.tensionOsc.start();
      }
      // Pitch rises as danger peaks
      const dangerPitch = 600 + (tensionRatio - 0.78) * 1800;
      this.tensionOsc.frequency.setValueAtTime(dangerPitch, this.ctx.currentTime);
      this.tensionGain?.gain.setValueAtTime(0.08 + (tensionRatio - 0.78) * 0.2, this.ctx.currentTime);
    } else {
      if (this.tensionOsc) {
        try {
          this.tensionOsc.stop();
          this.tensionOsc.disconnect();
        } catch {}
        this.tensionOsc = null;
        this.tensionGain = null;
      }
    }
  }

  public stopTensionSound() {
    if (this.tensionOsc) {
      try {
        this.tensionOsc.stop();
        this.tensionOsc.disconnect();
      } catch {}
      this.tensionOsc = null;
      this.tensionGain = null;
    }
  }

  public playLineSnap() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    this.stopTensionSound();
    this.stopReelingSound();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playCatchSuccess(isLegendaryOrMythic: boolean = false) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    this.stopTensionSound();
    this.stopReelingSound();
    const now = this.ctx.currentTime;

    const chord = isLegendaryOrMythic
      ? [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98] // Majestic C Major celestial arpeggio
      : [440, 554.37, 659.25, 880]; // Warm A Major triumph

    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = isLegendaryOrMythic ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const noteDuration = 0.6;
      gain.gain.setValueAtTime(0.22, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + noteDuration);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + noteDuration + 0.05);
    });
  }

  public playCoinDing() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1318.51, now); // E6
    osc.frequency.setValueAtTime(1760, now + 0.06); // A6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playCoins() {
    this.playCoinDing();
  }

  public playFanfare() {
    this.playCatchSuccess(true);
  }

  public playCancel() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.setValueAtTime(180, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playWorkbenchCraft() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    // Anvil tap / wooden carve clicks
    [0, 0.09, 0.18].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + idx * 220, now + offset);
      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.09);
    });

    // Pleasant finished chime
    setTimeout(() => {
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(1174.66, t + 0.08);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.42);
    }, 240);
  }

  public playEquipGear() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.setValueAtTime(780, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playFishApproaching() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  public playHookEscape() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.35);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }
}

export const soundEngine = new SoundEngine();
