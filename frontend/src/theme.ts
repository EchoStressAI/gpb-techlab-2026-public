export const color = {
  orange: '#FF7313',
  orangeHover: '#D95E08',
  green: '#00A600',
  amber: '#FB7D00',
  red: '#770303',
  blue: '#0042C7',
  ink: '#354D6C',
  inkMuted: '#8B99B0',
  bg: '#F9F9F9',
  card: '#FFFFFF',
  border: '#E1E1E1',
  chipBg: '#F7F7F7',
  track: '#F0F0F0',
} as const;

export const radius = { card: 16, control: 8, inner: 15, pill: 16 } as const;

export const shadow = {
  card: '0 0 10px rgba(0,0,0,0.05)',
  header: '0 .125rem .25rem rgba(0,0,0,.075)',
} as const;

/** Цвет статуса задания. */
export const statusColor: Record<string, string> = {
  queued: color.inkMuted,
  running: color.blue,
  done: color.green,
  failed: color.red,
};
