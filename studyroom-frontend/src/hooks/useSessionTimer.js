import { useEffect, useState } from 'react';

export function useSessionTimer(startTimeISO) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTimeISO) {
      setElapsed(0);
      return;
    }

    const startMs = new Date(startTimeISO).getTime();

    function tick() {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [startTimeISO]);

  return elapsed;
}
