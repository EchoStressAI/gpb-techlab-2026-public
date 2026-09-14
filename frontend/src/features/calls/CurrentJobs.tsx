import { useEffect, useState } from 'react';
import { color, radius, shadow } from '../../theme';
import { StatusBadge } from '../../components/ui';
import { dateTime } from '../../utils/format';
import type { JobEvent, JobRow } from './useJobs';
import { ProcessingTimer, clockWithTenths } from './ProcessingTimer';
import { useTypicalDuration } from './useTypicalDuration';

/**
 * Состояние последней отправки — прямо на странице загрузки.
 *
 * Показывает не весь список, а только что отправленное: пока считается —
 * с пояснением, что результата ещё нет; после завершения остаётся на
 * месте, добавляя ссылку на разбор. Следующая загрузка заменяет
 * содержимое, а не дописывает снизу.
 *
 * Свежие статусы приходят из того же опроса, что питает список, —
 * отдельных запросов блок не делает.
 */
export function CurrentJobs({
  jobs, events, onOpen,
}: {
  jobs: JobRow[];
  events: Record<string, JobEvent[]>;
  onOpen: (jobId: string) => void;
}) {
  if (jobs.length === 0) return null;

  return (
    <div style={{
      background: color.card, borderRadius: radius.card,
      boxShadow: shadow.card, padding: '20px 24px', marginTop: 16,
    }}>
      {jobs.map((job, i) => (
        <div
          key={job.job_id}
          style={{
            paddingTop: i === 0 ? 0 : 16,
            marginTop: i === 0 ? 0 : 16,
            borderTop: i === 0 ? 'none' : `1px solid ${color.border}80`,
          }}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: 20, flexWrap: 'wrap',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, wordBreak: 'break-word' }}>
                {job.filename}
              </div>
              <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6, lineHeight: 1.7 }}>
                Сотрудник {job.operator_id} · загрузил {job.submitted_by} ·{' '}
                {dateTime(job.submitted_at)}
                <br />
                {/* job_id — это загрузка, call_id — сам звонок. Не взаимозаменяемы. */}
                <span style={{
                  fontFamily: 'ui-monospace, monospace', fontSize: 13, wordBreak: 'break-all',
                }}>
                  job {job.job_id} · call {job.call_id}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <StatusBadge status={job.status} />
              {job.status === 'done' && (
                // Кнопка ровно та же, что в списке записей: одно и то
                // же действие не должно выглядеть на экране по-разному.
                <button
                  type="button"
                  onClick={() => onOpen(job.job_id)}
                  style={{
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                    color: '#FFFFFF', background: color.orange, border: 'none',
                    borderRadius: radius.control, padding: '7px 16px',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Открыть
                </button>
              )}
            </div>
          </div>

          <EventLog job={job} events={events[job.job_id] ?? []} />
        </div>
      ))}
    </div>
  );
}

/**
 * Таймер и журнал событий.
 *
 * Новое событие встаёт сверху, прежние уходят вниз — блок растёт вниз.
 * Время в строке — по часам клиента с десятыми долями, как и таймер:
 * одни часы на весь блок, иначе строки не сопоставить с секундомером.
 */
function EventLog({ job, events }: { job: JobRow; events: JobEvent[] }) {
  // Опора для оценки — прошлые записи того же сценария. Своего кейса у
  // старых записей может не быть, тогда считаем по выбранному.
  const typical = useTypicalDuration(
    job.case_id === 'CASE_1' || job.case_id === 'CASE_2' ? job.case_id : 'CASE_2',
  );
  // Начало отсчёта — первая строка журнала, то есть момент отправки.
  // Журнал переживает перезагрузку, поэтому после F5 таймер продолжает
  // ту же секунду, а не начинает заново. Запасной вариант — время
  // приёма задания на сервисе: он нужен для записей, загруженных до
  // появления журнала.
  const startedAt = events[0]?.at ?? Date.parse(job.submitted_at);
  const finished = events.find((e) => e.terminal) ?? null;
  const stoppedAt = finished
    ? finished.at
    : TERMINAL.includes(job.status)
      // Терминальный статус без события: журнал потерян при перезагрузке,
      // а обработка уже кончилась. Часы на нуле лучше, чем бегущие.
      ? startedAt
      : null;

  const newestFirst = [...events].reverse();

  return (
    <div style={{
      marginTop: 14, border: `1px solid ${color.border}80`,
      borderRadius: radius.control, overflow: 'hidden',
    }}>
      <ProgressBar
        startedAt={startedAt} stoppedAt={stoppedAt} typical={typical}
      />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, padding: '10px 14px', background: `${color.ink}06`,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.75 }}>
            {stoppedAt === null ? 'Идёт обработка' : 'Обработка завершена'}
          </div>
          {/* Текущая стадия с сервиса. Показывается, пока обработка идёт:
              это единственный честный признак движения — предсказывать
              оставшееся время нечем, 60 и 180 секунд относятся к длине
              анализируемого сигнала, а не к длительности счёта. */}
          {stoppedAt === null && stageLine(job) && (
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 3 }}>
              {stageLine(job)}
            </div>
          )}
        </div>
        {Number.isFinite(startedAt) && (
          <ProcessingTimer startedAt={startedAt} stoppedAt={stoppedAt} />
        )}
      </div>

      {newestFirst.length === 0 ? (
        <div style={{ padding: '10px 14px', fontSize: 14, opacity: 0.6 }}>
          Состояние обновляется автоматически. Журнал этой записи не
          велся: она загружена до его появления.
        </div>
      ) : (
        <div>
          {newestFirst.map((e, i) => (
            <div
              key={`${e.at}-${i}`}
              style={{
                display: 'grid', gridTemplateColumns: '104px 1fr', gap: 12,
                padding: '7px 14px', fontSize: 14,
                borderTop: i === 0 ? 'none' : `1px solid ${color.border}60`,
                // Самое свежее событие — вверху и заметнее прочих.
                background: i === 0 ? `${color.orange}0D` : 'transparent',
              }}
            >
              <div style={{
                fontFamily: 'ui-monospace, monospace',
                fontVariantNumeric: 'tabular-nums', opacity: 0.65,
              }}>
                {clockWithTenths(e.at)}
              </div>
              <div style={{ fontWeight: i === 0 ? 600 : 400 }}>{e.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TERMINAL = ['done', 'failed'];

/**
 * Строка текущей стадии: что сервис считает прямо сейчас.
 *
 * Текст берётся из `progress.message` как есть. Счётчик задач — именно
 * счётчик: общего числа сервис не сообщает, и в проценты его переводить
 * нельзя.
 */
function stageLine(job: JobRow): string | null {
  const p = job.progress;
  if (!p) return null;
  // Пропущенная стадия — не то, что стоит показывать как текущую работу.
  if (p.stage_status === 'SKIPPED_NO_INPUT') return null;
  const parts: string[] = [];
  if (p.message?.trim()) parts.push(p.message.trim());
  else if (p.stage) parts.push(`стадия ${p.stage}`);
  if (typeof p.completed_tasks === 'number') parts.push(`задач: ${p.completed_tasks}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Полоса хода обработки.
 *
 * Долю выполненного сервис не сообщает, поэтому полоса не притворяется
 * точной. Пока длительность предсказуема по прошлым записям того же
 * сценария, полоса идёт по этой оценке, но до конца не доходит никогда:
 * упирается в потолок и дальше подползает всё медленнее. Заполнение
 * доводится до края только по факту завершения.
 *
 * Если прошлых записей мало, оценки нет вовсе — тогда полоса бегущая, без
 * процентов и обещаний времени. Показывать выдуманный процент хуже, чем
 * не показывать никакого.
 */
function ProgressBar({
  startedAt, stoppedAt, typical,
}: { startedAt: number; stoppedAt: number | null; typical: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (stoppedAt !== null) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [stoppedAt]);

  if (!Number.isFinite(startedAt)) return null;

  const done = stoppedAt !== null;
  const elapsed = Math.max(0, (done ? stoppedAt : now) - startedAt);
  const fraction = done ? 1 : estimate(elapsed, typical);
  const unknown = !done && fraction === null;

  const left = !done && typical !== null ? Math.max(0, typical - elapsed) : null;

  return (
    <div>
      <div style={{
        position: 'relative', height: 6, overflow: 'hidden',
        background: `${color.ink}12`,
      }}>
        {unknown ? (
          // Бегущая полоса: движение есть, обещаний нет.
          <div style={{
            position: 'absolute', top: 0, bottom: 0, width: '30%',
            background: color.orange, borderRadius: 3,
            animation: 'echostress-sweep 1.6s ease-in-out infinite',
          }} />
        ) : (
          <div style={{
            height: '100%', width: `${Math.round((fraction ?? 0) * 100)}%`,
            background: done ? color.green : color.orange,
            transition: 'width 0.5s linear',
          }} />
        )}
      </div>

      {!done && (
        <div style={{ padding: '6px 14px 0', fontSize: 12, opacity: 0.6 }}>
          {left === null
            ? 'Время обработки заранее неизвестно'
            : left > 0
              ? `Ориентировочно осталось ${humanLeft(left)} — оценка по прошлым записям этого сценария`
              : 'Дольше обычного — обработка продолжается'}
        </div>
      )}

      <style>{`
        @keyframes echostress-sweep {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

/**
 * Доля заполнения. null — оценивать нечем.
 *
 * До ожидаемого срока полоса идёт ровно, но лишь до 85%: оставшийся
 * запас нужен на то, что расчёт затянется. После срока она подползает к
 * 99% и там замирает — сотая доля не закрывается, пока сервис не
 * ответил, что работа кончилась.
 */
function estimate(elapsed: number, typical: number | null): number | null {
  if (typical === null || typical <= 0) return null;
  if (elapsed < typical) return 0.85 * (elapsed / typical);
  const over = (elapsed - typical) / typical;
  return 0.85 + 0.14 * (1 - Math.exp(-over));
}

function humanLeft(ms: number): string {
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec} с`;
  const min = Math.floor(sec / 60);
  const rest = sec % 60;
  return rest === 0 ? `${min} мин` : `${min} мин ${rest} с`;
}
