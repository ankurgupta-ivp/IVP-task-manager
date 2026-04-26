// src/components/UI.jsx
import { useEffect, useRef, useState } from 'react'

/* ─── Buttons ─────────────────────────────────────────── */
const btnBase = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  borderRadius: 4, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--ivp-font)',
  fontWeight: 500, border: 'none', padding: '6px 14px', transition: 'background 0.15s',
}

export function BtnPrimary({ children, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...btnBase, background: disabled ? '#ccc' : 'var(--ivp-primary)', color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      {children}
    </button>
  )
}

export function BtnGhost({ children, onClick, disabled, style }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...btnBase, background: 'transparent', fontWeight: 400,
        border: `1px solid ${hover ? 'var(--ivp-primary)' : '#c4c4c4'}`,
        color: hover ? 'var(--ivp-primary)' : '#404041', ...style }}>
      {children}
    </button>
  )
}

export function BtnDanger({ children, onClick, style }) {
  return (
    <button onClick={onClick}
      style={{ ...btnBase, background: 'var(--ivp-status-failed)', color: '#fff', ...style }}>
      {children}
    </button>
  )
}

export function Icon({ name, size = 18, style }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, ...style }}>{name}</span>
}

/* ─── Priority badge ──────────────────────────────────── */
const PRIORITY_STYLE = {
  Urgent: { background: '#fde8e8', color: '#c62828' },
  High:   { background: '#fff3e0', color: '#e65100' },
  Medium: { background: '#e3f2fd', color: '#1565c0' },
  Low:    { background: '#f1f8e9', color: '#558b2f' },
}
export function PriorityBadge({ name }) {
  const s = PRIORITY_STYLE[name] || { background: '#eee', color: '#444' }
  return <span style={{ ...s, fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 3, display: 'inline-block' }}>{name}</span>
}

/* ─── Status badge ────────────────────────────────────── */
export function StatusBadge({ name, statuses }) {
  const s = statuses?.find(x => x.name === name)
  const bg   = s?.color    || '#eee'
  const text = s?.textColor|| '#444'
  return <span style={{ background: bg, color: text, fontSize: 12, padding: '2px 8px', borderRadius: 10, fontWeight: 500, display: 'inline-block', whiteSpace: 'nowrap' }}>{name}</span>
}

/* ─── Tag chip ────────────────────────────────────────── */
export function TagChip({ name, tags, onRemove }) {
  const t = tags?.find(x => x.name === name)
  const col = t?.color || '#888'
  return (
    <span style={{ color: col, borderColor: col, background: col + '18', border: '1px solid', fontSize: 11,
      padding: '2px 7px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 3,
      whiteSpace: 'nowrap', margin: '1px' }}>
      {name}
      {onRemove && <span style={{ cursor: 'pointer', marginLeft: 2, fontSize: 13, lineHeight: 1 }} onClick={onRemove}>×</span>}
    </span>
  )
}

/* ─── Assignee avatar ─────────────────────────────────── */
export function AssigneeAvatar({ user, size = 22 }) {
  if (!user) return <span style={{ color: '#aaa' }}>—</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: size, height: size, borderRadius: '50%', background: user.avatar_color || user.color || '#404789',
        color: '#fff', fontSize: size * 0.45, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {user.initials}
      </span>
      {size > 22 && <span>{user.display_name || user.name}</span>}
    </span>
  )
}

export function RoleBadge({ role }) {
  const map = {
    admin:    { bg: '#404789', text: '#fff', label: 'Admin' },
    edit:     { bg: '#e8a025', text: '#fff', label: 'Edit' },
    readonly: { bg: '#9e9e9e', text: '#fff', label: 'Read-Only' },
  }
  const s = map[role] || map.edit
  return <span style={{ background: s.bg, color: s.text, fontSize: 10, padding: '2px 7px', borderRadius: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{s.label}</span>
}

/* ─── Modal ───────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, footer, width = 640 }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        width, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.18s ease' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ivp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ivp-heading)' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', padding: 4 }}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ivp-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  )
}

/* ─── Form field ──────────────────────────────────────── */
export function Field({ label, required, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && <label style={{ fontSize: 13, color: '#666' }}>{label}{required && <span style={{ color: 'var(--ivp-status-failed)' }}> *</span>}</label>}
      {children}
    </div>
  )
}

export const inputStyle = {
  border: '1px solid var(--ivp-border-input)', borderRadius: 4, padding: '7px 10px',
  fontSize: 14, fontFamily: 'var(--ivp-font)', outline: 'none', color: '#212121',
  width: '100%',
}

export function Input({ style, onFocus, onBlur, ...props }) {
  const [focused, setFocused] = useState(false)
  return <input {...props}
    onFocus={e => { setFocused(true); onFocus?.(e) }}
    onBlur={e => { setFocused(false); onBlur?.(e) }}
    style={{ ...inputStyle, borderColor: focused ? 'var(--ivp-primary)' : 'var(--ivp-border-input)', ...style }} />
}

export function Select({ style, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <select {...props}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer',
        background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E") right 10px center no-repeat #fff`,
        paddingRight: 28, borderColor: focused ? 'var(--ivp-primary)' : 'var(--ivp-border-input)', ...style }}>
      {children}
    </select>
  )
}

export function Textarea({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return <textarea {...props}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={{ ...inputStyle, resize: 'vertical', minHeight: 72, borderColor: focused ? 'var(--ivp-primary)' : 'var(--ivp-border-input)', ...style }} />
}

/* ─── Toggle switch ───────────────────────────────────── */
export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)}
      style={{ width: 36, height: 18, background: on ? 'var(--ivp-primary)' : '#ccc', borderRadius: 9,
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, background: '#fff', borderRadius: '50%', position: 'absolute',
        top: 2, left: on ? 20 : 2, transition: 'left 0.2s' }} />
    </div>
  )
}

/* ─── Toast system ────────────────────────────────────── */
let _toastId = 0
let _setToasts = null

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  _setToasts = setToasts
  return (
    <>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#fff', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderLeft: `4px solid ${t.type === 'success' ? '#4caf50' : t.type === 'error' ? '#d32f2f' : 'var(--ivp-primary)'}`,
            padding: '12px 16px', fontSize: 13, minWidth: 240, display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideIn 0.25s ease',
          }}>
            <Icon name={t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'} size={18}
              style={{ color: t.type === 'success' ? '#4caf50' : t.type === 'error' ? '#d32f2f' : 'var(--ivp-primary)' }} />
            {t.msg}
          </div>
        ))}
      </div>
    </>
  )
}

export function toast(msg, type = 'info') {
  if (!_setToasts) return
  const id = ++_toastId
  _setToasts(prev => [...prev, { id, msg, type }])
  setTimeout(() => _setToasts(prev => prev.filter(t => t.id !== id)), 3500)
}

/* ─── Spinner ─────────────────────────────────────────── */
export function Spinner({ size = 32, style }) {
  return <div style={{ width: size, height: size, border: `${size * 0.08}px solid #ddd`,
    borderTopColor: 'var(--ivp-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', ...style }} />
}

/* ─── Loading overlay ─────────────────────────────────── */
export function LoadingOverlay({ show, message = 'Loading…' }) {
  if (!show) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.75)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <Spinner size={36} />
      <span style={{ fontSize: 14, color: '#666' }}>{message}</span>
    </div>
  )
}

/* ─── Section heading ─────────────────────────────────── */
export function SectionHeading({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ivp-primary)', letterSpacing: 0.5,
      textTransform: 'uppercase', margin: '18px 0 12px', paddingBottom: 6,
      borderBottom: '1px solid var(--ivp-separator)' }}>
      {children}
    </div>
  )
}
