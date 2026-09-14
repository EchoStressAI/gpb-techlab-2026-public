import { Link, useLocation, useNavigate } from 'react-router-dom';
import { color, radius, shadow } from '../theme';
import { useAuth } from '../auth/AuthContext';

/**
 * Шапка. По клику на логотип — туда же, куда ведёт «К списку записей».
 *
 * onHome нужен потому, что карточка звонка живёт не в маршруте, а в
 * состоянии страницы: одного перехода на «/» мало, открытую карточку
 * надо ещё и закрыть. Со страниц, где карточки нет, достаточно перехода.
 */
export function Header({ onHome }: { onHome?: () => void } = {}) {
  const { signOut, user, can } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const goHome = () => {
    onHome?.();
    if (location.pathname !== '/') navigate('/');
  };

  return (
    // Три колонки равной ширины, а не flex с распором по краям:
    // знак Газпромбанка должен стоять ровно по середине шапки, и при
    // равных колонках его положение не зависит ни от длины имени
    // субъекта справа, ни от наличия ссылки на журнал.
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 24,
      padding: '10px 24px', background: color.card, boxShadow: shadow.header,
      borderRadius: '0 0 16px 16px', position: 'sticky', top: 0, zIndex: 20,
      maxWidth: 1072, margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src="/logo.svg"
          alt="EchoStressAI"
          title="К списку записей"
          onClick={goHome}
          style={{ height: 60, display: 'block', cursor: 'pointer' }}
        />
      </div>

      {/* Без разделителя — как на форме входа, чтобы шапка и вход
          выглядели одинаково. */}
      <div>Демонстрационная версия для кейса Газпромбанка · Техлаб Москва 2026</div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20,
      }}>
        {/* Пункта «Записи» здесь нет намеренно: список и так открыт
            на главной, а возврат к нему уже дают логотип и ссылка
            «К списку записей» в карточке звонка. Третий путь к тому же
            месту только мешал — с главной он никуда не вёл. */}
        {/* Раздел журнала виден только при праве audit:read. */}
        {can('audit:read') && (
          <NavLink to="/audit" active={location.pathname === '/audit'}>Журнал</NavLink>
        )}
        {user && (
          <span style={{ fontSize: 14, opacity: 0.7 }}>{user.subject_id}</span>
        )}
        <div
          onClick={signOut}
          style={{
            border: `1px solid ${color.orange}`, borderRadius: radius.control,
            color: color.orange, fontSize: 15, padding: '6px 16px',
            background: '#FFFFFF', cursor: 'pointer',
          }}
        >
          Выйти
        </div>
      </div>
    </div>
  );
}

function NavLink({
  to, active, children,
}: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        fontSize: 15, fontWeight: 600, textDecoration: 'none',
        color: active ? color.ink : color.inkMuted,
      }}
    >
      {children}
    </Link>
  );
}
