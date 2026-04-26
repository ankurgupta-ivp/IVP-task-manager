// src/components/TopBar.jsx
import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { sb, isConfigured } from '../lib/supabase'
import { Icon, RoleBadge, Modal, Field, Input, BtnPrimary, BtnGhost, toast } from './UI'

export default function TopBar({ onToggleHideCompleted, hideCompleted, onOpenColConfig }) {
  const { state, dispatch } = useApp()
  const { currentUser, view } = state
  const [ddOpen, setDdOpen]   = useState(false)
  const [pwOpen, setPwOpen]   = useState(false)
  const [pwNew, setPwNew]     = useState('')
  const [pwConfirm, setPwConfirm] = useState('')

  function logout() {
    if (isConfigured() && state.sessionToken && state.sessionToken !== 'demo') {
      sb.deleteWhere('app_sessions', { token: `eq.${state.sessionToken}` }).catch(() => {})
    }
    localStorage.removeItem('ivp_session')
    dispatch({ type: 'LOGOUT' })
  }

  async function savePassword() {
    if (pwNew.length < 8) { toast('Minimum 8 characters', 'error'); return }
    if (pwNew !== pwConfirm) { toast('Passwords do not match', 'error'); return }
    if (!isConfigured()) { toast('Requires Supabase connection', 'error'); return }
    try {
      await sb.rpc('app_set_password', { p_user_id: currentUser.id, p_new_password: pwNew })
      setPwOpen(false); toast('Password updated', 'success')
    } catch (e) { toast('Failed: ' + e.message, 'error') }
  }

  const tabStyle = active => ({
    padding: '0 16px', fontSize: 14, color: 'var(--ivp-text-dark)',
    borderBottom: `3px solid ${active ? 'var(--ivp-tab-accent)' : 'transparent'}`,
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', height: 48,
    fontWeight: active ? 500 : 400, background: 'transparent',
    fontFamily: 'var(--ivp-font)',
  })

  return (
    <>
      <div style={{ height: 48, background: '#fff', borderBottom: '1px solid var(--ivp-border)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, position: 'relative', zIndex: 100 }}>
        {/* Logo */}
        <div style={{ width: 28, height: 28, background: 'var(--ivp-primary)', borderRadius: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>IVP</div>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ivp-heading)' }}>Task Manager</span>

        {/* Tabs */}
        <div style={{ display: 'flex', marginLeft: 16 }}>
          <button style={tabStyle(view === 'tasks')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'tasks' })}>Tasks</button>
          {currentUser?.role === 'admin' && (
            <button style={tabStyle(view === 'admin')} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'admin' })}>Admin Panel</button>
          )}
        </div>

        {/* Right icons */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onToggleHideCompleted} title={hideCompleted ? 'Show completed' : 'Hide completed'}
            style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: '#666' }}>
            <Icon name={hideCompleted ? 'visibility_off' : 'visibility'} size={18} />
          </button>
          <button onClick={onOpenColConfig} title="Configure columns"
            style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: '#666' }}>
            <Icon name="view_column" size={18} />
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--ivp-border)', margin: '0 4px' }} />

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setDdOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px',
                borderRadius: 4, border: 'none', background: 'transparent', fontFamily: 'var(--ivp-font)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: currentUser?.avatar_color || 'var(--ivp-primary)',
                color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentUser?.initials}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ivp-text-dark)' }}>{currentUser?.display_name}</div>
                <div style={{ fontSize: 11, color: '#999' }}><RoleBadge role={currentUser?.role} /></div>
              </div>
              <Icon name="arrow_drop_down" size={16} style={{ color: '#999' }} />
            </button>

            {ddOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setDdOpen(false)} />
                <div style={{ position: 'absolute', top: 42, right: 0, background: '#fff', border: '1px solid var(--ivp-border)',
                  borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 180, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{currentUser?.display_name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{currentUser?.email}</div>
                  </div>
                  {[
                    { icon: 'lock',   label: 'Change Password', action: () => { setDdOpen(false); setPwOpen(true) } },
                    { icon: 'logout', label: 'Sign Out',         action: logout, danger: true },
                  ].map(item => (
                    <div key={item.label} onClick={item.action}
                      style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        color: item.danger ? 'var(--ivp-status-failed)' : 'inherit' }}
                      onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#fff0f0' : '#f5f5ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Icon name={item.icon} size={16} /> {item.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Change password modal */}
      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Change Password" width={400}
        footer={<><BtnPrimary onClick={savePassword}>Update Password</BtnPrimary><BtnGhost onClick={() => setPwOpen(false)}>Cancel</BtnGhost></>}>
        <Field label="New Password" required style={{ marginBottom: 14 }}>
          <Input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Minimum 8 characters" />
        </Field>
        <Field label="Confirm Password" required>
          <Input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Repeat password" />
        </Field>
      </Modal>
    </>
  )
}
