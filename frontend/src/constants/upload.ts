import type { ChannelRoles, SpeakerRole } from '../types';

/**
 * Ограничения загрузки.
 *
 * Два канала и предел в 512 МБ — по контракту. Набор форматов шире, чем
 * в документе по подключению: там указан только PCM WAV, но сервис
 * принимает и MP3, конвертация на стороне фронтенда не нужна.
 *
 * Список здесь — предварительный отсев, а не правило доступа. Последнее
 * слово за сервисом: он проверяет и кодек, и число каналов, и отвечает
 * 400 с причиной. Поэтому добавление формата сюда ничего не ломает —
 * оно лишь перестаёт мешать отправке.
 */

export const MAX_FILE_SIZE_MB = 512;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const REQUIRED_CHANNELS = 2;

export const ACCEPTED_AUDIO = [
  {
    label: 'WAV',
    extensions: ['.wav'],
    mimeTypes: ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave'],
  },
  {
    label: 'MP3',
    extensions: ['.mp3'],
    // Браузеры и ОС называют MP3 по-разному: Windows часто отдаёт
    // audio/mp3, Linux — audio/mpeg, иногда тип пустой вовсе. Поэтому
    // перечислены все ходовые варианты, а проверка по расширению
    // работает как запасная.
    mimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/mpeg3', 'audio/x-mpeg-3'],
  },
] as const;

export const ACCEPTED_LABELS = 'WAV или MP3, 2 канала';

export const ACCEPT_ATTRIBUTE = ACCEPTED_AUDIO.flatMap((f) => [
  ...f.extensions,
  ...f.mimeTypes,
]).join(',');

const ALL_EXTENSIONS = ACCEPTED_AUDIO.flatMap((f) => f.extensions as readonly string[]);
const ALL_MIME_TYPES = ACCEPTED_AUDIO.flatMap((f) => f.mimeTypes as readonly string[]);

export type RejectReason = 'type' | 'size';

export interface RejectedFile {
  name: string;
  reason: RejectReason;
  message: string;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' ГБ';
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + ' МБ';
  return Math.round(bytes / 1024) + ' КБ';
}

function hasAllowedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ALL_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function hasAllowedMimeType(type: string): boolean {
  return type !== '' && ALL_MIME_TYPES.includes(type.toLowerCase());
}

/**
 * Проверка файла до отправки.
 *
 * Число каналов и настоящий кодек браузер надёжно не скажет — это
 * проверяет сервер и отвечает 400. Здесь отсекаются только явные
 * несоответствия, чтобы не гонять по сети заведомо негодное.
 */
export function validateFile(file: File): RejectedFile | null {
  if (!hasAllowedExtension(file.name) && !hasAllowedMimeType(file.type)) {
    return {
      name: file.name,
      reason: 'type',
      message: `неподдерживаемый формат · принимается только ${ACCEPTED_LABELS}`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      name: file.name,
      reason: 'size',
      message: `${formatBytes(file.size)} · превышен предел ${MAX_FILE_SIZE_MB} МБ`,
    };
  }
  return null;
}

export function partitionFiles(files: File[]): {
  accepted: File[];
  rejected: RejectedFile[];
} {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];
  for (const file of files) {
    const problem = validateFile(file);
    if (problem) rejected.push(problem);
    else accepted.push(file);
  }
  return { accepted, rejected };
}

// ---------- Роли каналов ----------

export const ROLE_OPTIONS: { value: SpeakerRole; label: string }[] = [
  { value: 'CALLER', label: 'Клиент' },
  { value: 'SUPPORT_OPERATOR', label: 'Оператор' },
];

/**
 * Значение по умолчанию. Это именно умолчание формы, а не правило
 * сервиса: привязка «нулевой канал — клиент» верна для конкретной
 * выгрузки, поэтому роли всегда передаются явно и остаются
 * редактируемыми.
 */
export const DEFAULT_CHANNEL_ROLES: ChannelRoles = {
  '0': 'CALLER',
  '1': 'SUPPORT_OPERATOR',
};

/** Противоположная роль. Ролей ровно две, третьего не дано. */
export function oppositeRole(role: SpeakerRole): SpeakerRole {
  return role === 'CALLER' ? 'SUPPORT_OPERATOR' : 'CALLER';
}

/**
 * Роли обоих каналов по выбору для нулевого.
 *
 * Запись двухканальная, роли взаимно исключают друг друга — значит
 * выбор для одного канала полностью определяет второй, и показывать
 * два списка незачем.
 */
export function rolesFromChannelZero(role: SpeakerRole): ChannelRoles {
  return { '0': role, '1': oppositeRole(role) };
}

/** Человеческое название роли. */
export function roleLabel(role: SpeakerRole | undefined): string {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? '—';
}

/**
 * Канал с ролью оператора обязателен: без него признаки состояния
 * считать не по кому.
 */
export function validateRoles(roles: ChannelRoles): string | null {
  const values = Object.values(roles);
  if (!values.includes('SUPPORT_OPERATOR')) {
    return 'Нужен канал с ролью «Оператор» — иначе состояние считать не по кому';
  }
  return null;
}
