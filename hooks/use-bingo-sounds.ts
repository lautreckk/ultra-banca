'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

const BINGO_SOUNDS: Record<number, string> = {};
for (let i = 1; i <= 90; i++) {
  BINGO_SOUNDS[i] = `/sounds/bingo/${i}.mp3`;
}

export function useBingoSounds() {
  const contextRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<number, AudioBuffer>>(new Map());
  const [muted, setMuted] = useState(false);
  const preloadedRef = useRef(false);
  const unlockListenerRef = useRef(false);

  useEffect(() => {
    setMuted(localStorage.getItem('bingo-muted') === 'true');
  }, []);

  const getOrCreateContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  // Resume AudioContext after user gesture (required by browser policy)
  const ensureUnlocked = useCallback(async () => {
    const ctx = getOrCreateContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }
  }, [getOrCreateContext]);

  // Setup a one-time click/touch listener to unlock AudioContext
  useEffect(() => {
    if (unlockListenerRef.current) return;
    unlockListenerRef.current = true;

    const unlock = () => {
      ensureUnlocked();
      if (!preloadedRef.current) {
        preloadAudio();
      }
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preload all 90 audio files in background
  const preloadAudio = useCallback(async () => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;

    const ctx = getOrCreateContext();
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { /* ignore */ }
    }

    // Load in batches of 10
    for (let batch = 0; batch < 9; batch++) {
      const promises = [];
      for (let i = batch * 10 + 1; i <= (batch + 1) * 10 && i <= 90; i++) {
        promises.push(
          fetch(BINGO_SOUNDS[i])
            .then(r => r.arrayBuffer())
            .then(ab => ctx.decodeAudioData(ab))
            .then(buffer => { buffersRef.current.set(i, buffer); })
            .catch(() => {})
        );
      }
      await Promise.all(promises);
    }
  }, [getOrCreateContext]);

  // preload is now safe to call - it won't create AudioContext until user interacts
  const preload = useCallback(() => {
    // Don't create AudioContext here - let the click/touch listener handle it
    // This prevents the "AudioContext was not allowed to start" warning
  }, []);

  const playNumber = useCallback(async (num: number) => {
    if (muted || num < 1 || num > 90) return;
    try {
      const ctx = getOrCreateContext();
      if (ctx.state === 'suspended') await ctx.resume();

      let buffer = buffersRef.current.get(num);
      if (!buffer) {
        const response = await fetch(BINGO_SOUNDS[num]);
        const ab = await response.arrayBuffer();
        buffer = await ctx.decodeAudioData(ab);
        buffersRef.current.set(num, buffer);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch {
      // Audio is non-critical
    }
  }, [muted, getOrCreateContext]);

  const toggleMute = useCallback(() => {
    // Also unlock audio on mute toggle (it's a user gesture)
    ensureUnlocked();
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem('bingo-muted', String(next));
      return next;
    });
  }, [ensureUnlocked]);

  return { playNumber, preload, muted, toggleMute };
}
