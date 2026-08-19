import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

/* Musta pilleri, keltainen teksti, 108px alareunasta, 1.9 s. */
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)

  const toast = useCallback(text => {
    setMsg(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 1900)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {msg && <div className="toast" style={S.toast}>{msg}</div>}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

const S = {
  toast: {
    position: 'fixed', left: '50%', bottom: 108, transform: 'translateX(-50%)',
    background: 'var(--ink)', color: 'var(--yellow)', borderRadius: 'var(--r-pill)',
    padding: '11px 18px', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
    zIndex: 20, boxShadow: '0 8px 20px rgba(30,27,23,.25)',
    animation: 'toastIn .18s ease-out'
  }
}
