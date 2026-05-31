// Safe Web Audio API synthesizer for tactile board game sounds
class SoundSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (err) {
        console.warn("AudioContext not supported or blocked in this environment:", err);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a soft paper drawing style swipe chord
  playCardDraw() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Low pass filter noise or sine sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Soft plastic-wood thud for chip placement
  playChipDrop() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Body thud (low sine)
    const oscBody = this.ctx.createOscillator();
    const gainBody = this.ctx.createGain();
    
    oscBody.type = 'sine';
    oscBody.frequency.setValueAtTime(90, now);
    oscBody.frequency.exponentialRampToValueAtTime(45, now + 0.1);
    
    gainBody.gain.setValueAtTime(0.2, now);
    gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    oscBody.connect(gainBody);
    gainBody.connect(this.ctx.destination);
    oscBody.start(now);
    oscBody.stop(now + 0.25);

    // Click sound (high transient)
    const oscClick = this.ctx.createOscillator();
    const gainClick = this.ctx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(1200, now);
    oscClick.frequency.exponentialRampToValueAtTime(800, now + 0.03);
    
    gainClick.gain.setValueAtTime(0.15, now);
    gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    oscClick.connect(gainClick);
    gainClick.connect(this.ctx.destination);
    oscClick.start(now);
    oscClick.stop(now + 0.05);
  }

  // Soft buzzer for error/invalid movements
  playError() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Satisfying bell ding for completed sequences
  playSequenceDone() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });
  }

  // Victory fanfare melody
  playVictory() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 523.25, d: 0.15 }, // C5
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.3 },  // E5
      { f: 587.33, d: 0.15 }, // D5
      { f: 659.25, d: 0.15 }, // E5
      { f: 698.46, d: 0.15 }, // F5
      { f: 783.99, d: 0.6 }   // G5
    ];

    let timeAcc = 0;
    melody.forEach((note) => {
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(note.f, now + timeAcc);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(note.f * 1.5, now + timeAcc); // High fifth overlay

      gain.gain.setValueAtTime(0, now + timeAcc);
      gain.gain.linearRampToValueAtTime(0.12, now + timeAcc + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + timeAcc + note.d - 0.01);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx!.destination);

      osc1.start(now + timeAcc);
      osc2.start(now + timeAcc);
      osc1.stop(now + timeAcc + note.d);
      osc2.stop(now + timeAcc + note.d);

      timeAcc += note.d + 0.03;
    });
  }
}

export const synth = new SoundSynth();
