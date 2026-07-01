const FADE_STEP_MS = 25;

export function fadeAudioVolume(
  audio: HTMLAudioElement,
  targetVolume: number,
  durationMs: number
): Promise<void> {
  return new Promise((resolve) => {
    const startVolume = audio.volume;
    const delta = targetVolume - startVolume;

    if (Math.abs(delta) < 0.01 || durationMs <= 0) {
      audio.volume = Math.max(0, Math.min(1, targetVolume));
      resolve();
      return;
    }

    const steps = Math.max(1, Math.round(durationMs / FADE_STEP_MS));
    let step = 0;

    const interval = window.setInterval(() => {
      step += 1;
      const progress = step / steps;
      audio.volume = Math.max(
        0,
        Math.min(1, startVolume + delta * progress)
      );

      if (step >= steps) {
        window.clearInterval(interval);
        audio.volume = Math.max(0, Math.min(1, targetVolume));
        resolve();
      }
    }, FADE_STEP_MS);
  });
}

export async function fadeOutAudio(
  audio: HTMLAudioElement,
  durationMs = 500
): Promise<void> {
  await fadeAudioVolume(audio, 0, durationMs);
  audio.pause();
}

export async function fadeInAudio(
  audio: HTMLAudioElement,
  targetVolume: number,
  durationMs = 500
): Promise<void> {
  audio.volume = 0;

  try {
    await audio.play();
  } catch {
    return;
  }

  await fadeAudioVolume(audio, targetVolume, durationMs);
}
