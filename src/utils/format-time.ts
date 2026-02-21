const MONTHS = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
];

function isToday(date: Date, now: Date): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

function padZero(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatSessionTime(updatedAt: string): string {
  const date = new Date(updatedAt);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) {
    return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  }

  if (diffMs < 60_000) {
    return 'hozir';
  }

  if (diffMs < 3_600_000) {
    return `${Math.floor(diffMs / 60_000)} min`;
  }

  if (isToday(date, now)) {
    return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  }

  if (isYesterday(date, now)) {
    return 'kecha';
  }

  return `${padZero(date.getDate())}-${MONTHS[date.getMonth()]}`;
}
