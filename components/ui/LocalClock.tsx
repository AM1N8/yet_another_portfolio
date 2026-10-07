"use client";

import { useEffect, useState } from "react";

export function LocalClock({
  timezone,
  locale,
}: {
  timezone: string;
  locale: string;
}) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const update = () => {
      if (!document.hidden) setTime(formatter.format(new Date()));
    };
    const interval = window.setInterval(update, 60_000);
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, [timezone, locale]);
  return (
    <span className="local-clock label">
      <span>LOCAL TIME</span>
      <time
        aria-label={`Local time in ${timezone}`}
        dateTime={time || undefined}
      >
        {time || "--:--"}
      </time>
    </span>
  );
}
