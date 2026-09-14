import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { color, radius, shadow, statusColor } from '../theme';
import type { JobStatus } from '../types';
import { STATUS_LABEL } from '../features/calls/useJobs';

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: color.card, borderRadius: radius.card, boxShadow: shadow.card, ...style,
    }}>
      {children}
    </div>
  );
}

/** Полоса-прогресс. width — строка вида "72%". */
export function Bar({ width, fill, height = 8 }: { width: string; fill: string; height?: number }) {
  return (
    <div style={{
      height, borderRadius: radius.pill, background: color.track, overflow: 'hidden',
    }}>
      <div style={{ height: '100%', borderRadius: radius.pill, background: fill, width }} />
    </div>
  );
}

export function Chip({
  active, children, onClick,
}: { active: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 16px', borderRadius: radius.control, fontSize: 16,
        cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap', flex: '0 0 auto',
        border: `1px solid ${active ? color.ink : color.border}`,
        background: active ? color.ink : '#FFFFFF',
        color: active ? '#FFFFFF' : color.ink,
      }}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: JobStatus }) {
  const c = statusColor[status] ?? color.ink;
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: radius.pill,
      fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
      color: c, background: `${c}14`,
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/**
 * Чекбокс с поддержкой третьего состояния.
 *
 * indeterminate нельзя задать атрибутом в HTML — это только свойство
 * DOM-узла, поэтому проставляем его через ref. Нужно для заголовка
 * таблицы, когда выбрана часть строк.
 */
export function Checkbox({
  checked, indeterminate = false, onChange, ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.checked)}
      // Клик по строке не должен всплывать и открывать запись.
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 16, height: 16, margin: 0, cursor: 'pointer',
        accentColor: color.ink, display: 'block',
      }}
    />
  );
}

/**
 * Подсказка по наведению и фокусу.
 *
 * Реагирует не только на мышь: на клавиатуре открывается по Tab, на
 * тач-экранах — по нажатию, где события наведения не срабатывают.
 */
export function Hint({ text, children }: { text: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        cursor: 'help', outline: 'none',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
      tabIndex={0}
      role="button"
      aria-label={text}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0,
            zIndex: 30, width: 300, padding: '10px 12px',
            background: color.ink, color: '#FFFFFF',
            borderRadius: radius.control, fontSize: 13, lineHeight: 1.5,
            fontWeight: 400, textAlign: 'left',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            // Подсказка не должна перехватывать курсор и мигать.
            pointerEvents: 'none',
            textWrap: 'pretty',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
