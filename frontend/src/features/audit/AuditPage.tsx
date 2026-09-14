import { useEffect, useState } from 'react';
import { color, radius, shadow } from '../../theme';
import type { AuditRecord, AuditResponse } from '../../types';
import { getAudit } from '../../api/calls';
import { ApiError } from '../../api/client';
import { Header } from '../../components/Header';
import { dateTime } from '../../utils/format';
import { Notice } from '../calls/UploadPanel';

const ACTION_LABEL: Record<string, string> = {
  submit_call: 'Загрузка записи',
  read_result: 'Просмотр результата',
  read_transcript: 'Просмотр расшифровки',
  read_risk: 'Просмотр оценки',
  read_audit: 'Чтение журнала',
  denied: 'Отказ в доступе',
};

const COLS = '170px 1.2fr 1.4fr 1fr 1fr 90px';

/** Журнал обращений. Чтение журнала само записывается в журнал. */
export function AuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAudit({ limit: 200 })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: color.bg, paddingBottom: 80 }}>
      <Header />
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px 0' }}>
        <h1 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700 }}>
          Журнал обращений
        </h1>

        {loading && <div style={{ fontSize: 15, opacity: 0.7 }}>Загрузка журнала…</div>}

        {error && (
          error instanceof ApiError && error.isForbidden
            ? <Notice tone="warning">
                Журнал закрыт. Нужно право <code>{error.requiredScope ?? 'audit:read'}</code>.
              </Notice>
            : <Notice tone="error">{error.message}</Notice>
        )}

        {data && (
          <div style={{
            background: color.card, borderRadius: radius.card,
            boxShadow: shadow.card, overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 24px', fontSize: 14, opacity: 0.7 }}>
              Показано {data.returned} из {data.total} · выводятся последние записи
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: COLS, gap: 12,
              padding: '10px 24px', fontSize: 13, fontWeight: 700, opacity: 0.6,
            }}>
              <div>Время</div><div>Кто</div><div>Действие</div>
              <div>Звонок</div><div>Сотрудник</div><div>Итог</div>
            </div>
            {data.records.map((r: AuditRecord, i: number) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: COLS, gap: 12,
                padding: '10px 24px', fontSize: 13, alignItems: 'center',
                borderTop: `1px solid ${color.border}80`,
              }}>
                <div style={{ opacity: 0.75 }}>{dateTime(r.at)}</div>
                <div>{r.subject_id}</div>
                <div>
                  {ACTION_LABEL[r.action] ?? r.action}
                  {r.detail && (
                    <div style={{
                      fontSize: 11, opacity: 0.55,
                      fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all',
                    }}>
                      {r.detail}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                  {r.call_id ?? '—'}
                </div>
                <div>{r.operator_id ?? '—'}</div>
                <div style={{ color: r.granted ? color.green : color.red, fontWeight: 600 }}>
                  {r.granted ? 'разрешено' : 'отказ'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
