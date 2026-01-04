import { useState, useEffect, useCallback } from 'react';

export function useTimer(
  initialTime: number,
  enabled: boolean,
  onTimeout?: () => void
) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!enabled || !isRunning || timeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;

        if (newTime <= 0) {
          setIsRunning(false);
          if (onTimeout) {
            onTimeout();
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, isRunning, timeRemaining, onTimeout]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime?: number) => {
    setTimeRemaining(newTime ?? initialTime);
    setIsRunning(false);
  }, [initialTime]);

  const setTime = useCallback((time: number) => {
    setTimeRemaining(time);
  }, []);

  return {
    timeRemaining,
    isRunning,
    start,
    stop,
    reset,
    setTime,
  };
}
