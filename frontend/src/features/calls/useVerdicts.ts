import { useEffect, useRef, useState } from 'react';
import { getCase1, getRisk } from '../../api/calls';
import { CASE1_DECISION_LABEL } from '../../types';
import type { CaseId } from '../../types';
import type { JobRow } from './useJobs';

/**
 * Краткий итог по записи для колонок списка.
 *
 * `verdict` — словесный вывод модели, `score` — её числовая величина.
 * Числа тут ранговые, а не вероятностные, поэтому процентом они не
 * подписываются нигде: ни здесь, ни в колонке.
 */
export interface Verdict {
  verdict: string;
  /** Машинный код вердикта или полосы: короткая подпись для таблицы. */
  code: string;
  score: number | null;
  /** Оценка не выносится: показывать число как результат нельзя. */
  abstain: boolean;
  /** Слой не посчитан — причина, а не пустая клетка. */
  unavailable?: string;
}

type Cache = Record<string, Verdict | null>;

/**
 * Догружает итог по готовым записям страницы.
 *
 * Запрашиваются только те, что уже `done` и ещё не спрошены: список
 * опрашивается каждые несколько секунд, и тянуть результат заново на
 * каждом тике было бы лишней нагрузкой. Ответ кладётся в кэш на время
 * жизни вкладки.
 *
 * Кейс определяет ручку: `/case1` для первого сценария, `/risk` для
 * второго. Перепутать их нельзя — у каждого свой слой, и чужой отдаёт
 * пустоту.
 */
export function useVerdicts(jobs: JobRow[], caseId: CaseId) {
  const [cache, setCache] = useState<Cache>({});
  // Запрошенные, чтобы не дёргать сервис повторно при перерисовке.
  const asked = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pending = jobs.filter(
      (j) => j.status === 'done' && !asked.current.has(j.job_id),
    );
    if (pending.length === 0) return;

    const ctrl = new AbortController();

    pending.forEach((job) => {
      asked.current.add(job.job_id);
      const scenario = jobCase(job) ?? caseId;

      const request = scenario === 'CASE_1'
        ? getCase1(job.job_id, ctrl.signal).then(readCase1)
        : getRisk(job.job_id, ctrl.signal).then(readCase2);

      request
        .then((v) => setCache((prev) => ({ ...prev, [job.job_id]: v })))
        .catch((e) => {
          if (e instanceof DOMException && e.name === 'AbortError') {
            // Ушли со страницы — ответ не нужен, но и запрет на
            // повторный запрос снимаем: иначе колонка останется пустой.
            asked.current.delete(job.job_id);
            return;
          }
          setCache((prev) => ({ ...prev, [job.job_id]: null }));
        });
    });

    return () => ctrl.abort();
  }, [jobs, caseId]);

  return cache;
}

function jobCase(job: JobRow): CaseId | null {
  if (job.case_id === 'CASE_1' || job.case_id === 'CASE_2') return job.case_id;
  const id = job.call_id?.toLowerCase() ?? '';
  if (id.endsWith('_case_1')) return 'CASE_1';
  if (id.endsWith('_case_2')) return 'CASE_2';
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function readCase1(data: any): Verdict {
  const p = data?.primary;
  if (!p) return { verdict: '—', code: '—', score: null, abstain: true, unavailable: 'слой не посчитан' };
  if (p.status !== 'OK') {
    return { verdict: '—', code: '—', score: null, abstain: true, unavailable: p.status };
  }
  const decision = p.decision_status ?? '';
  return {
    verdict: CASE1_DECISION_LABEL[decision] ?? decision ?? '—',
    code: p.evidence_status ?? decision ?? '—',
    score: typeof p.primary_score === 'number' ? p.primary_score : null,
    abstain: decision === 'INSUFFICIENT_EVIDENCE',
  };
}

function readCase2(data: any): Verdict {
  const p = data?.primary;
  if (!p) return { verdict: '—', code: '—', score: null, abstain: true, unavailable: 'слой не посчитан' };
  if (p.status !== 'OK') {
    return { verdict: '—', code: '—', score: null, abstain: true, unavailable: p.status };
  }
  return {
    // Полосу берём с сервера как есть: своими словами уровень не
    // переписываем.
    verdict: p.risk_band ?? '—',
    code: p.risk_band ?? '—',
    score: typeof p.risk_score === 'number' ? p.risk_score : null,
    abstain: false,
  };
}
