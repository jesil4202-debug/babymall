// frontend/components/CountdownTimer.tsx
import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  /** total seconds for the countdown */
  initialSeconds: number;
  /** callback when timer reaches zero */
  onExpire?: () => void;
}

export const CountdownTimer = ({ initialSeconds, onExpire }: CountdownTimerProps) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire?.();
      return;
    }
    const id = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, onExpire]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <span className="font-medium text-primary-600">
      {mm}:{ss}
    </span>
  );
};
