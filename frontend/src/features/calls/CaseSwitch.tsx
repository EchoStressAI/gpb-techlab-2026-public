import { color, radius, shadow } from '../../theme';
import { CASES } from '../../types';
import type { CaseId } from '../../types';

/**
 * Выбор сценария: воздействие мошенников или риск выгорания.
 *
 * Кейс уходит в запрос полем `case_id`: backend по нему маршрутизирует
 * расчёт. Он же делит интерфейс: куда положить запись в списке и какой
 * экран результата показывать первым.
 */
export function CaseSwitch({
  value, onChange,
}: { value: CaseId; onChange: (id: CaseId) => void }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 16, marginBottom: 16,
    }}>
      {CASES.map((c) => {
        const active = c.id === value;
        // Точка цветом различает сценарии: синий — кейс 1, оранжевый — кейс 2.
        const dot = c.id === 'CASE_1' ? color.blue : color.orange;

        return (
          <div
            key={c.id}
            onClick={() => onChange(c.id)}
            style={{
              background: color.card, borderRadius: radius.card,
              boxShadow: shadow.card, padding: '18px 22px', cursor: 'pointer',
              border: `2px solid ${active ? dot : 'transparent'}`,
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: color.inkMuted, marginBottom: 8,
            }}>
              <span style={{
                width: 9, height: 9, borderRadius: '50%', background: dot,
                display: 'inline-block',
              }} />
              {c.kicker}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              {c.title}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.75 }}>
              {c.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}
