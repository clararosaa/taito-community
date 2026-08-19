import { useEffect } from 'react'

/* Alhaalta nouseva paneeli. Sulkeutuu taustaa tai ✕:ää napauttamalla.
   Sanulin ohje- ja tulostauludrawerit käyttävät tätä myöhemmin. */
export default function Sheet({ title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.centering}>
        <div style={S.panel} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
          <div style={S.head}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <h2 style={S.title}>{title}</h2>
              {subtitle && <div style={S.sub}>{subtitle}</div>}
            </div>
            <button style={S.close} onClick={onClose} aria-label="Sulje">✕</button>
          </div>
          <div style={S.body}>{children}</div>
          {footer && <div style={S.footer}>{footer}</div>}
        </div>
      </div>
    </div>
  )
}

const S = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(30,27,23,.42)',
    zIndex: 30, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
  },
  centering: { width: '100%', maxWidth: 430, margin: '0 auto', display: 'flex', maxHeight: '92vh' },
  panel: {
    flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
    background: 'var(--surface-warm)',
    borderRadius: 'var(--r-drawer) var(--r-drawer) 0 0',
    boxShadow: 'var(--shadow-drawer)',
    animation: 'sheetIn .2s ease-out',
    overflow: 'hidden'
  },
  head: {
    flex: 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 12, padding: '18px var(--header-pad) 12px'
  },
  title: { fontWeight: 700, fontSize: 22, color: 'var(--ink)' },
  sub: { fontSize: 11.5, fontWeight: 600, color: 'var(--text-4)' },
  close: {
    width: 34, height: 34, borderRadius: '50%', flex: 'none',
    background: 'var(--sand-2)', color: 'var(--text-2)', fontSize: 14, fontWeight: 700
  },
  body: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 var(--content-pad) 14px' },
  footer: {
    flex: 'none', background: 'var(--white)', borderTop: '1px solid var(--border-card)',
    padding: `12px var(--content-pad) calc(12px + env(safe-area-inset-bottom))`
  }
}
