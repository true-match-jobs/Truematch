import { useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

type RelativeTimeProps = {
  value: string | number | Date;
  className?: string;
};

const toRelativeLabel = (timestamp: Dayjs, now: Dayjs) => {
  const minutes = now.diff(timestamp, 'minute');

  if (minutes < 1) {
    return 'now';
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = now.diff(timestamp, 'hour');

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = now.diff(timestamp, 'day');

  if (days < 7) {
    return `${days}d`;
  }

  if (days < 30) {
    const weeks = Math.max(1, now.diff(timestamp, 'week'));
    return `${weeks}w`;
  }

  const months = now.diff(timestamp, 'month');

  if (months < 12) {
    return `${Math.max(1, months)}mon`;
  }

  const years = now.diff(timestamp, 'year');
  return `${Math.max(1, years)}y`;
};

export const RelativeTime = ({ value, className }: RelativeTimeProps) => {
  const timestamp = useMemo(() => dayjs(value), [value]);
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(dayjs());
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  if (!timestamp.isValid()) {
    return null;
  }

  return (
    <time dateTime={timestamp.toISOString()} className={className}>
      {toRelativeLabel(timestamp, now)}
    </time>
  );
};
