/**
 * Universal Web Audio Synthesizer for VoIP Calling Tones
 * Generates phone rings, incoming ringtones, call connected beeps, and busy tones
 * with ZERO external MP3 files or network assets.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private currentOscillators: OscillatorNode[] = [];
  private currentGain: GainNode | null = null;
  private loopInterval: any = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public stop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.currentOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.currentOscillators = [];
    if (this.currentGain) {
      try {
        this.currentGain.disconnect();
      } catch {}
      this.currentGain = null;
    }
  }

  /**
   * Outgoing Ringing Tone (Classic 440Hz + 480Hz phone ring pulse)
   */
  public playOutgoingRing() {
    this.stop();
    const playBurst = () => {
      try {
        const ctx = this.getContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 440; // A4
        osc2.frequency.value = 480; // B4

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        osc1.stop(ctx.currentTime + 2.0);
        osc2.stop(ctx.currentTime + 2.0);

        this.currentOscillators = [osc1, osc2];
        this.currentGain = gain;
      } catch (err) {
        console.warn('Ring tone error', err);
      }
    };

    playBurst();
    this.loopInterval = setInterval(playBurst, 4000);
  }

  /**
   * Incoming Call Melody (Pleasant melodic marimba chime)
   */
  public playIncomingRingtone() {
    this.stop();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    const playMelody = () => {
      try {
        const ctx = this.getContext();
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.value = freq;

          const startTime = ctx.currentTime + idx * 0.18;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
      } catch (err) {
        console.warn('Incoming ring error', err);
      }
    };

    playMelody();
    this.loopInterval = setInterval(playMelody, 2200);
  }

  /**
   * Call Connected Notification Tone (Quick upward double beep)
   */
  public playConnectedTone() {
    this.stop();
    try {
      const ctx = this.getContext();
      [587.33, 880.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.1);
      });
    } catch {}
  }

  /**
   * Call Ended / Busy Tone
   */
  public playCallEndedTone() {
    this.stop();
    try {
      const ctx = this.getContext();
      [480, 480].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = 400;

        const startTime = ctx.currentTime + idx * 0.2;
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    } catch {}
  }
}

export const audioSynthesizer = new AudioSynthesizer();
