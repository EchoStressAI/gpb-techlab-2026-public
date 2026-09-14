import { useEffect, useState } from 'react';
import { color, radius, shadow } from '../../theme';
import { dateTime } from '../../utils/format';
import { getEmployeeCalls, getEmployees } from '../../api/calls';
import { ApiError } from '../../api/client';
import type { Employee, EmployeeCall } from '../../types';

/**
 * Личная история сотрудника — кейс 2.
 *
 * Смысл кейса в накоплении: проверенная единица наблюдения — период
 * работы человека, а не отдельный звонок. Поэтому история показана
 * таблицей по звонкам, но вывод по одной строке не делается и нигде
 * так не подписан.
 *
 * Метка выгорания (CONTROL) сервису неизвестна. Здесь она не
 * достраивается ни по числам, ни по динамике: неизвестно — значит
 * неизвестно.
 */
export function EmployeeHistory() {
  const [people, setPeople] = useState<Employee[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [calls, setCalls] = useState<EmployeeCall[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingCalls, setLoadingCalls] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    getEmployees(ac.signal)
      .then((list) => {
        setPeople(list);
        setChosen((prev) => prev ?? list[0]?.employee_id ?? null);
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setPeople([]);
        setError(
          e instanceof ApiError && e.status === 404
            ? 'Сервис не отдаёт список сотрудников'
            : e instanceof Error ? e.message : 'Не удалось получить список',
        );
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!chosen) return;
    const ac = new AbortController();
    setLoadingCalls(true);
    setCalls(null);
    getEmployeeCalls(chosen, undefined, ac.signal)
      .then((list) => {
        // Свежие сверху — как и в остальных таблицах.
        setCalls([...list].sort((a, b) => time(b) - time(a)));
        setError(null);
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setCalls([]);
        setError(e instanceof Error ? e.message : 'Не удалось получить историю');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingCalls(false);
      });
    return () => ac.abort();
  }, [chosen]);

  return (
    <div style={{
      background: color.card, borderRadius: radius.card,
      boxShadow: shadow.card, overflow: 'hidden', marginTop: 16,
    }}>
      <div style={{ padding: '18px 24px' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Личная история сотрудника</div>
        <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4, lineHeight: 1.6 }}>
          Проверенная единица наблюдения — период работы, а не отдельный
          разговор. По одной строке вывод о человеке не делается.
        </div>

        {people === null ? (
          <div style={{ marginTop: 14, fontSize: 14, opacity: 0.7 }}>Загрузка списка…</div>
        ) : people.length === 0 ? (
          <div style={{ marginTop: 14, fontSize: 14, opacity: 0.7 }}>
            {error ?? 'Сервис не знает ни одного сотрудника с историей'}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {people.map((p) => {
              const active = p.employee_id === chosen;
              const count = p.calls_count ?? p.n_calls ?? null;
              return (
                <button
                  key={p.employee_id}
                  type="button"
                  onClick={() => setChosen(p.employee_id)}
                  style={{
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                    padding: '7px 14px', borderRadius: radius.control, cursor: 'pointer',
                    border: `1px solid ${active ? color.ink : color.border}`,
                    background: active ? color.ink : '#FFFFFF',
                    color: active ? '#FFFFFF' : color.ink,
                  }}
                >
                  {p.employee_id}
                  {count !== null && (
                    <span style={{ fontWeight: 400, opacity: 0.7 }}> · {count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {chosen && (
        loadingCalls ? (
          <Note>Загрузка истории…</Note>
        ) : !calls || calls.length === 0 ? (
          <Note>{error ?? 'По этому сотруднику история пуста'}</Note>
        ) : (
          <CallsTable calls={calls} />
        )
      )}
    </div>
  );
}

const COLS = '36px 1.4fr 1fr 1.2fr 1fr 1fr 1fr';

function CallsTable({ calls }: { calls: EmployeeCall[] }) {
  return (
    <>
      <div style={{
        display: 'grid', gridTemplateColumns: COLS, gap: 16, padding: '10px 24px',
        fontSize: 13, fontWeight: 700, opacity: 0.6,
        borderTop: `1px solid ${color.border}80`,
      }}>
        <div>№</div>
        <div>Время разговора</div>
        <div>Индекс</div>
        <div>Уровень</div>
        <div>Тревожность</div>
        <div>Эмоц. баланс</div>
        <div>Скрытый негатив</div>
      </div>

      {calls.map((c, i) => (
        <div
          key={c.call_id ?? c.job_id ?? i}
          style={{
            display: 'grid', gridTemplateColumns: COLS, gap: 16,
            alignItems: 'center', padding: '10px 24px', fontSize: 14,
            borderTop: `1px solid ${color.border}60`,
          }}
        >
          {/* Нумерация убывает сверху вниз, как в остальных таблицах. */}
          <div style={{ opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}>
            {calls.length - i}
          </div>
          {/*
            Время разговора, а не время загрузки: по нему строится
            порядок истории.
          */}
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {c.call_datetime ? dateTime(c.call_datetime) : '—'}
          </div>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {fixed(c.risk_score, 3)}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{c.risk_band ?? '—'}</div>
          {/* Supporting-метрики: объясняют состояние и динамику, но в
              основной риск по Acoustic11 не входят. */}
          <div style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85 }}>
            {fixed(c.anxiety_n_1, 2)}
          </div>
          <div style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85 }}>
            {fixed(c.emotional_balance, 2)}
          </div>
          <div style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85 }}>
            {fixed(c.hidden_negative_share, 2)}
          </div>
        </div>
      ))}

      <div style={{
        padding: '12px 24px', fontSize: 13, opacity: 0.7, lineHeight: 1.7,
        borderTop: `1px solid ${color.border}80`,
      }}>
        Индекс — относительная ранговая величина модели, не вероятность
        выгорания. Три правые колонки объясняют состояние и динамику, но в
        основной расчёт риска не входят. Метка выгорания сервису
        неизвестна и здесь не достраивается.
      </div>
    </>
  );
}

/** Время разговора для сортировки. Отсутствует — в конец списка. */
function time(c: EmployeeCall): number {
  const t = c.call_datetime ? Date.parse(c.call_datetime) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function fixed(v: number | null | undefined, digits: number): string {
  return typeof v === 'number' ? v.toFixed(digits) : '—';
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '24px', textAlign: 'center', fontSize: 15, opacity: 0.75,
      borderTop: `1px solid ${color.border}80`,
    }}>
      {children}
    </div>
  );
}
