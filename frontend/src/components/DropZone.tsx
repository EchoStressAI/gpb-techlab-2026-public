import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { color, radius, shadow } from '../theme';
import {
  ACCEPT_ATTRIBUTE,
  ACCEPTED_LABELS,
  MAX_FILE_SIZE_MB,
  partitionFiles,
  type RejectedFile,
} from '../constants/upload';

interface Props {
  onFiles: (files: File[]) => void;
}

export function DropZone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);

  // Счётчик вложенных dragenter/dragleave. Без него подсветка мигает,
  // когда курсор проходит над дочерними элементами зоны.
  const dragDepth = useRef(0);

  function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    const { accepted, rejected: bad } = partitionFiles(Array.from(files));
    setRejected(bad);
    if (accepted.length > 0) onFiles(accepted);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    handle(e.target.files);
    // Сбрасываем значение, иначе повторный выбор того же файла
    // не вызовет событие change.
    e.target.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    handle(e.dataTransfer.files);
  }

  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  }

  // preventDefault в dragover обязателен, иначе браузер откроет
  // файл в новой вкладке вместо передачи его в onDrop.
  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function open() {
    inputRef.current?.click();
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        onClick={open}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        }}
        role="button"
        tabIndex={0}
        style={{
          background: dragging ? `${color.orange}0A` : color.card,
          border: `1px dashed ${dragging ? color.orange : `${color.orange}66`}`,
          borderRadius: radius.card,
          boxShadow: shadow.card,
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          outline: 'none',
          transition: 'background .15s, border-color .15s',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
          {dragging
            ? 'Отпустите, чтобы добавить файлы'
            : 'Перетащите аудиофайлы или выберите с компьютера'}
        </div>
        <div style={{ fontSize: 15, opacity: 0.7 }}>
          {ACCEPTED_LABELS} · один или несколько файлов · до {MAX_FILE_SIZE_MB} МБ
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          onChange={onInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {rejected.length > 0 && (
        <div style={{
          marginTop: 12, background: `${color.red}0A`,
          border: `1px solid ${color.red}33`, borderRadius: radius.inner,
          padding: '12px 16px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, marginBottom: 8,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: color.red }}>
              Не добавлено файлов: {rejected.length}
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setRejected([]);
              }}
              style={{ fontSize: 13, color: color.orange, cursor: 'pointer' }}
            >
              Скрыть
            </span>
          </div>
          {rejected.map((r, i) => (
            <div key={i} style={{ fontSize: 13, lineHeight: 1.7 }}>
              <b>{r.name}</b> — {r.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
