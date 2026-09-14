import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { color, radius, shadow } from '../../theme';
import {
  ACCEPT_ATTRIBUTE, ACCEPTED_LABELS, MAX_FILE_SIZE_MB,
  formatBytes, partitionFiles, type RejectedFile,
} from '../../constants/upload';
import { caseInfo } from '../../types';
import type { CaseId } from '../../types';
import type { SubmitMeta, UploadProgress } from './useJobs';

interface Props {
  onSubmit: (files: File[], meta: SubmitMeta) => void;
  uploading: boolean;
  /** Ход отправки. null — ничего не отправляется. */
  progress?: UploadProgress | null;
  /** Выбранный сценарий: влияет на заголовок и на раздел списка. */
  caseId: CaseId;
}

/**
 * Загрузка записей.
 *
 * Форма сведена к одному действию: файл плюс выбранный сценарий.
 * Сотрудника, время разговора и роли каналов backend определяет сам —
 * по имени файла и frozen mapping, вручную их вводить не нужно.
 */
export function UploadPanel({ onSubmit, uploading, progress, caseId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);

  const [formError, setFormError] = useState<string | null>(null);

  /** Какое поле не прошло проверку. null — претензий нет. */
  const [badField, setBadField] = useState<BadField>(null);

  /** Снять подсветку, когда правят именно то поле, что подсвечено. */
  function clearIf(field: BadField) {
    if (badField === field) {
      setBadField(null);
      setFormError(null);
    }
  }

  function accept(list: FileList | null) {
    if (!list || list.length === 0) return;
    const { accepted, rejected: bad } = partitionFiles(Array.from(list));
    setRejected(bad);
    if (accepted.length > 0) {
      setQueue((prev) => [...prev, ...accepted]);
      clearIf('files');
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    accept(e.dataTransfer.files);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    accept(e.target.files);
    e.target.value = '';
  }

  /**
   * Отметить поле виновным.
   *
   * Текста ошибки над формой мало: когда полей несколько, человек
   * читает надпись и всё равно ищет глазами, куда её отнести. Поэтому
   * рядом с текстом подсвечивается само поле.
   */
  function fail(field: BadField, message: string) {
    setBadField(field);
    setFormError(message);
  }

  function send() {
    setFormError(null);
    setBadField(null);

    if (queue.length === 0) {
      fail('files', 'Добавьте хотя бы один файл');
      return;
    }
    onSubmit(queue, { case_id: caseId });
    setQueue([]);
  }

  return (
    <div style={{
      background: color.card, borderRadius: radius.card,
      boxShadow: shadow.card, padding: '20px 24px', marginBottom: 16,
    }}>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>
        Загрузка записей · {caseInfo(caseId).title}
      </div>

      {/* Дропзона */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => { e.preventDefault(); dragDepth.current += 1; setDragging(true); }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) { dragDepth.current = 0; setDragging(false); }
        }}
        role="button"
        tabIndex={0}
        style={{
          marginTop: 16,
          // Пустая очередь — тоже ошибка поля, и дропзона здесь играет
          // роль поля. Перетаскивание важнее: пока файл над зоной,
          // показываем готовность принять, а не прошлую претензию.
          background: dragging
            ? `${color.orange}0A`
            : badField === 'files' ? `${color.red}0A` : '#FFFFFF',
          border: `1px dashed ${
            dragging ? color.orange
              : badField === 'files' ? color.red
              : `${color.orange}66`
          }`,
          borderRadius: radius.card, padding: '28px 24px',
          textAlign: 'center', cursor: 'pointer', outline: 'none',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          {dragging ? 'Отпустите, чтобы добавить' : 'Перетащите записи или выберите с компьютера'}
        </div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>
          {ACCEPTED_LABELS} · до {MAX_FILE_SIZE_MB} МБ
        </div>
        <input
          ref={inputRef} type="file" multiple accept={ACCEPT_ATTRIBUTE}
          onChange={onInputChange} style={{ display: 'none' }}
        />
      </div>

      {queue.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {queue.map((f, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 14, padding: '6px 0',
              borderTop: i > 0 ? `1px solid ${color.border}80` : undefined,
            }}>
              <span>{f.name} <span style={{ opacity: 0.6 }}>· {formatBytes(f.size)}</span></span>
              <span
                onClick={() => setQueue((prev) => prev.filter((_, j) => j !== i))}
                style={{ color: color.orange, cursor: 'pointer', fontSize: 13 }}
              >
                убрать
              </span>
            </div>
          ))}
        </div>
      )}

      {rejected.length > 0 && (
        <Notice tone="error">
          {rejected.map((r, i) => (
            <div key={i}><b>{r.name}</b> — {r.message}</div>
          ))}
        </Notice>
      )}

      {formError && <Notice tone="error">{formError}</Notice>}

      {/* Предел записи — 512 МБ: без полосы отправка выглядит зависшей. */}
      {progress && <ProgressBar progress={progress} />}

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <div
          onClick={uploading ? undefined : send}
          style={{
            padding: '8px 20px', borderRadius: radius.control, fontSize: 16,
            color: '#FFFFFF', cursor: uploading ? 'default' : 'pointer',
            background: uploading ? color.inkMuted : color.ink,
          }}
        >
          {uploading ? 'Отправка…' : `Отправить в обработку${queue.length ? ` · ${queue.length}` : ''}`}
        </div>
      </div>
    </div>
  );
}

/**
 * Ход отправки.
 *
 * Когда браузер не сообщает объём (fraction === null), полоса не
 * рисуется вовсе: ползунок, ползущий сам по себе, врал бы о ходе дела.
 */
function ProgressBar({ progress }: { progress: UploadProgress }) {
  const percent = progress.fraction === null ? null : Math.round(progress.fraction * 100);
  const done = progress.fraction !== null && progress.fraction >= 1;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 13, marginBottom: 6, gap: 12,
      }}>
        <span style={{ wordBreak: 'break-word' }}>
          {progress.total > 1 && (
            <span style={{ opacity: 0.6 }}>{progress.index} из {progress.total} · </span>
          )}
          {progress.filename}
        </span>
        <span style={{ opacity: 0.7, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {percent === null ? 'отправка…' : done ? 'принимается сервисом…' : `${percent}%`}
        </span>
      </div>
      {percent !== null && (
        <div style={{
          height: 6, borderRadius: 999, background: `${color.ink}14`, overflow: 'hidden',
        }}>
          <div style={{
            width: `${percent}%`, height: '100%', background: color.orange,
            borderRadius: 999, transition: 'width 120ms linear',
          }} />
        </div>
      )}
      {done && (
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
          Файл ушёл целиком. Сервис проверяет запись и заводит задание —
          сам анализ начнётся после этого и займёт минуты.
        </div>
      )}
    </div>
  );
}

/** Тип поля, на которое указывает проверка. */
type BadField = 'files' | null;

export function Notice({
  tone, children,
}: { tone: 'error' | 'warning' | 'info'; children: React.ReactNode }) {
  const c = tone === 'error' ? color.red : tone === 'warning' ? color.amber : color.blue;
  return (
    <div style={{
      marginTop: 12, background: `${c}0F`, border: `1px solid ${c}33`,
      borderRadius: radius.inner, padding: '10px 14px',
      fontSize: 14, lineHeight: 1.6, color: tone === 'info' ? color.ink : c,
    }}>
      {children}
    </div>
  );
}
