export const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const beep = (startTime, freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square'; // sharper, more attention-grabbing than a plain sine tone
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    };

    const now = ctx.currentTime;
    // three ascending beeps, repeated twice — hard to miss, still short enough not to be annoying
    [0, 0.4, 0.8, 1.4, 1.8, 2.2].forEach((offset, i) => {
      beep(now + offset, i % 3 === 0 ? 700 : i % 3 === 1 ? 900 : 1100);
    });
  } catch (err) {
    console.error('Could not play alert sound', err);
  }
};