import { useRef, useCallback } from "react";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playNotification = useCallback((durationSeconds: number = 30) => {
    // Stop any existing playback
    stopNotification();

    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    // Play immediately
    playBeep();

    // Play every 2 seconds for the duration
    let elapsedTime = 0;
    intervalRef.current = setInterval(() => {
      elapsedTime += 2;
      if (elapsedTime >= durationSeconds) {
        stopNotification();
        return;
      }
      playBeep();
    }, 2000);

    // Auto-stop after duration
    setTimeout(() => {
      stopNotification();
    }, durationSeconds * 1000);
  }, []);

  const stopNotification = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { playNotification, stopNotification };
}
