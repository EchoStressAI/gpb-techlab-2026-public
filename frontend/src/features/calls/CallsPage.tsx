import { useEffect, useRef, useState } from 'react';
import { color, radius, shadow } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { Header } from '../../components/Header';
import { useJobs, type JobRow } from './useJobs';
import { UploadPanel, Notice } from './UploadPanel';
import { CurrentJobs } from './CurrentJobs';
import { UploadHistory } from './UploadHistory';
import { EmployeeHistory } from './EmployeeHistory';
import { CaseSwitch } from './CaseSwitch';
import { caseInfo } from '../../types';
import type { CaseId } from '../../types';

/** Выбранный сценарий. Хранится отдельно от списка заданий. */
const CASE_KEY = 'echostress.case';
import { CallDetail } from './CallDetail';

export function CallsPage() {
  const { can } = useAuth();
  // Сценарий переживает перезагрузку: возвращаться каждый раз к первому
  // кейсу тому, кто работает со вторым, — лишняя работа на каждом заходе.
  const [caseId, setCaseId] = useState<CaseId>(
    () => (localStorage.getItem(CASE_KEY) as CaseId) || 'CASE_1',
  );

  const chooseCase = (id: CaseId) => {
    setCaseId(id);
    localStorage.setItem(CASE_KEY, id);
  };

  const a = useJobs(caseId);
  // Открытая запись хранится целиком: список приходит с сервера, и
  // искать её по идентификатору в локальном перечне больше негде.
  const [open, setOpen] = useState<JobRow | null>(null);

  /** Открыть по идентификатору — из блока текущей отправки. */
  const openJobById = (jobId: string) => {
    const found = a.jobs.find((j) => j.job_id === jobId);
    if (found) setOpen(found);
  };

  /**
   * Счётчик перезапросов истории. Меняется, когда отправка закончилась:
   * пока идёт загрузка, спрашивать сервис бессмысленно.
   */
  /** Активная таблица кейса 2. Первой открыт список записей. */
  const [tab, setTab] = useState<'records' | 'employee'>('records');

  const [historyKey, setHistoryKey] = useState(0);
  const wasUploading = useRef(false);
  useEffect(() => {
    if (wasUploading.current && !a.uploading) setHistoryKey((n) => n + 1);
    wasUploading.current = a.uploading;
  }, [a.uploading]);

  /**
   * Второй повод перечитать список — окончание расчёта.
   *
   * Отправка кончается задолго до готовности результата: файл ушёл, а
   * обработка идёт ещё минуты. Без этого строка в списке оставалась в
   * прежнем состоянии до ручного обновления, хотя рядом уже горело
   * «готово».
   */
  const lastStatuses = useRef<Record<string, string>>({});
  useEffect(() => {
    const finished = a.watched.some((j) => {
      const before = lastStatuses.current[j.job_id];
      return before !== undefined && before !== j.status
        && (j.status === 'done' || j.status === 'failed');
    });
    lastStatuses.current = Object.fromEntries(
      a.watched.map((j) => [j.job_id, j.status]),
    );
    if (finished) setHistoryKey((n) => n + 1);
  }, [a.watched]);

  if (open) {
    return (
      <div style={{ minHeight: '100vh', background: color.bg, paddingBottom: 80 }}>
        <Header onHome={() => setOpen(null)} />
        <CallDetail job={open} onBack={() => setOpen(null)} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: color.bg, paddingBottom: 80 }}>
      <Header />
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px 0' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, textAlign: 'center' }}>
          Анализ речевых записей
        </h1>

        {/* Выбор сценария виден всегда: он делит и список, не только
            загрузку. Без права calls:submit человек всё равно смотрит
            записи по одному кейсу за раз. */}
        <CaseSwitch value={caseId} onChange={chooseCase} />

        {/* Загрузка прячется, если права на неё нет. */}
        {can('calls:submit') ? (
          <UploadPanel
            onSubmit={a.upload} uploading={a.uploading}
            progress={a.progress} caseId={caseId}
          />
        ) : (
          <Notice tone="info">
            Загрузка записей закрыта: нет права <code>calls:submit</code>.
          </Notice>
        )}

        {a.error && <Notice tone="error">{a.error}</Notice>}

        {/* Состояние последней отправки — между загрузкой и списком. */}
        <CurrentJobs jobs={a.watched} events={a.events} onOpen={openJobById} />

        {/*
          В кейсе 2 таблиц две, и они про разное: список записей — про
          отдельные загрузки, личная история — про накопление по
          сотруднику. Показывать их одну под другой значило бы смешивать
          единицы наблюдения, поэтому они разведены по вкладкам.
          В кейсе 1 истории по человеку нет вовсе, и вкладки там лишние.
        */}
        {caseId === 'CASE_2' ? (
          <>
            <Tabs
              tabs={[
                { key: 'records', label: caseInfo(caseId).title },
                { key: 'employee', label: 'Личная история сотрудника' },
              ]}
              active={tab}
              onChange={setTab}
            />
            {tab === 'records' ? (
              <UploadHistory reloadKey={historyKey} caseId={caseId} onOpen={setOpen} />
            ) : (
              <EmployeeHistory />
            )}
          </>
        ) : (
          <UploadHistory reloadKey={historyKey} caseId={caseId} onOpen={setOpen} />
        )}
      </div>
    </div>
  );
}

/** Переключатель таблиц. Порядок вкладок задан явно и не сортируется. */
function Tabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div style={{
      display: 'flex', gap: 8, marginTop: 16, background: color.card,
      borderRadius: radius.card, boxShadow: shadow.card, padding: 6,
    }}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              flex: '1 1 0', fontFamily: 'inherit', fontSize: 15,
              fontWeight: on ? 700 : 600, padding: '10px 16px',
              borderRadius: radius.control, border: 'none', cursor: 'pointer',
              background: on ? color.ink : 'transparent',
              color: on ? '#FFFFFF' : color.ink,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
