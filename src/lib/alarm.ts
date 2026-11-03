let ctx: AudioContext | null = null;

/** Chame num toque do usuário (ex.: botão Iniciar) para liberar o áudio no iOS. */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* sem áudio */
  }
}

/** Alarme: bipes curtos + vibração (quando suportado). */
export function ring(times = 3) {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {
    /* ignora */
  }
  unlockAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (let i = 0; i < times; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = i % 2 ? 660 : 880;
    const t = now + i * 0.42;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.34);
  }
}
