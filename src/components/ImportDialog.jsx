import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const PURPLE = '#351E88';
const btn = {
  flex: 1, height: 46, borderRadius: 18, border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 16, fontWeight: 700, color: '#fff',
};

const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  const w = m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  return `${n} ${w}`;
};
const films = (n) => plural(n, 'фильм', 'фильма', 'фильмов');

/**
 * Preview of a film-list import: what will be created / added, then confirm.
 * summary — result of importCategories(groups, { dryRun: true }); null = nothing parsed.
 */
export default function ImportDialog({ fileName, summary, onConfirm, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const newCats = summary ? summary.filter((s) => s.isNew).length : 0;
  const added = summary ? summary.reduce((n, s) => n + s.added, 0) : 0;
  const nothing = !summary || summary.length === 0;
  const allThere = !nothing && added === 0 && newCats === 0;

  // Portal: the header is its own stacking context, the dock would otherwise sit on top
  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        background: '#171717',
        width: 430, maxWidth: 'calc(100vw - 48px)', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        borderRadius: 28, padding: '22px 22px 24px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        animation: 'modal-fade 0.22s ease',
      }}>
        <div className="d-title">Импорт из файла</div>
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, fontWeight: 500, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>

        {nothing ? (
          <div style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.45, textAlign: 'center', margin: '22px 4px 24px' }}>
            В файле не нашлось ни одного фильма.<br />
            <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              Название категории пиши в квадратных скобках — <b style={{ color: 'var(--text)' }}>[Ужасы]</b>, а под ней фильмы, каждый с новой строки.
            </span>
          </div>
        ) : (
          <>
            <div style={{ overflowY: 'auto', margin: '18px -6px 0', padding: '0 6px' }}>
              {summary.map((s) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, color: '#fff', fontSize: 16, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, color: s.added ? 'var(--text)' : 'var(--text-dim)', textAlign: 'right' }}>
                    {s.isNew && <span style={{ color: '#30D158' }}>новая · </span>}
                    {s.added ? `+${films(s.added)}` : (s.isNew ? 'пустая' : 'без изменений')}
                    {s.skipped > 0 && <span style={{ color: 'var(--text-dim)' }}> ({s.skipped} уже есть)</span>}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 14, fontWeight: 600, margin: '16px 0 18px' }}>
              {allThere
                ? 'Всё из этого файла уже есть в списке'
                : `Будет добавлено: ${plural(newCats, 'категория', 'категории', 'категорий')}, ${films(added)}`}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {nothing || allThere ? (
            <button type="button" onClick={onClose} style={{ ...btn, background: '#2C2C2C' }}>Понятно</button>
          ) : (
            <>
              <button type="button" onClick={onClose} style={{ ...btn, background: '#2C2C2C' }}>Отмена</button>
              <button type="button" onClick={onConfirm} style={{ ...btn, background: PURPLE }}>Загрузить</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
