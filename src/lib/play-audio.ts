function sameAudioPath(audio: HTMLAudioElement, src: string): boolean {
  try {
    const current = new URL(audio.src, window.location.origin).pathname;
    const target = new URL(src, window.location.origin).pathname;
    return current === target;
  } catch {
    return audio.src.endsWith(src);
  }
}

/** Joue un fichier audio et attend la fin (ou timeout). */
export function playAudioFile(
  audio: HTMLAudioElement,
  src: string,
  volume = 1,
  timeoutMs = 30_000
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (ok: boolean, error?: string) => {
      if (settled) return;
      settled = true;
      audio.onended = null;
      audio.onerror = null;
      clearTimeout(timer);
      resolve({ ok, error });
    };

    const timer = setTimeout(() => finish(true), timeoutMs);

    const startPlay = () => {
      audio.volume = volume;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => {
          audio.onended = () => finish(true);
        })
        .catch((err) =>
          finish(
            false,
            err instanceof Error ? err.message : "Lecture refusée par le navigateur"
          )
        );
    };

    audio.onerror = () =>
      finish(false, `Fichier introuvable : ${src}`);

    if (!sameAudioPath(audio, src) || audio.readyState < 2) {
      audio.src = src;
      audio.load();
      const onReady = () => {
        audio.removeEventListener("canplaythrough", onReady);
        startPlay();
      };
      audio.addEventListener("canplaythrough", onReady, { once: true });
      if (audio.readyState >= 3) {
        audio.removeEventListener("canplaythrough", onReady);
        startPlay();
      }
    } else {
      startPlay();
    }
  });
}
