// src/components/LeftNav.jsx
import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Icon } from './UI'

function NavItem({ icon, label, active, onClick, collapsed, tooltip, colorDot }) {
  return (
    <div onClick={onClick} title={collapsed ? tooltip : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 0' : '10px 14px',
        fontSize: 14, color: active ? 'var(--ivp-nav-active)' : 'var(--ivp-nav-text)', cursor: 'pointer',
        borderLeft: `3px solid ${active ? 'var(--ivp-nav-active)' : 'transparent'}`,
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        justifyContent: collapsed ? 'center' : 'flex-start',
        whiteSpace: 'nowrap', transition: 'background 0.15s', position: 'relative' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      {colorDot
        ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorDot, display: 'inline-block', flexShrink: 0 }} />
        : <Icon name={icon} size={18} style={{ flexShrink: 0 }} />}
      {!collapsed && <span>{label}</span>}
    </div>
  )
}

export default function LeftNav() {
  const { state, dispatch } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const { navFilter, config } = state

  const set = f => dispatch({ type: 'SET_NAV_FILTER', payload: f })

  return (
    <div style={{ width: collapsed ? 48 : 200, background: 'var(--ivp-nav-bg)', color: 'var(--ivp-nav-text)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', flexShrink: 0,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

      {/* Toggle */}
      <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', padding: collapsed ? '8px 0 4px' : '8px 10px 4px' }}>
        <button onClick={() => setCollapsed(c => !c)}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#fff',
            cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={18} />
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div style={{ padding: 8 }}>
          <input placeholder="🔍 Search..." style={{ width: '100%', background: 'var(--ivp-nav-sub)',
            border: 'none', borderRadius: 3, padding: '6px 10px', color: '#9799b1', fontSize: 13,
            fontFamily: 'var(--ivp-font)', outline: 'none' }} />
        </div>
      )}

      {/* Views */}
      {!collapsed && <div style={{ fontSize: 11, color: 'var(--ivp-nav-sep)', padding: '10px 14px 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Views</div>}
      {[
        { id: 'all',      icon: 'list',           label: 'All Tasks' },
        { id: 'mine',     icon: 'person',         label: 'My Tasks' },
        { id: 'assigned', icon: 'assignment_ind', label: 'Assigned to Me' },
        { id: 'shared',   icon: 'group',          label: 'Shared with Me' },
        { id: 'today',    icon: 'today',          label: 'Due Today' },
        { id: 'week',     icon: 'date_range',     label: 'Due This Week' },
        { id: 'overdue',  icon: 'warning',        label: 'Overdue' },
      ].map(v => (
        <NavItem key={v.id} icon={v.icon} label={v.label} active={navFilter === v.id}
          collapsed={collapsed} tooltip={v.label} onClick={() => set(v.id)} />
      ))}

      <div style={{ borderTop: '1px solid var(--ivp-nav-sep)', margin: '6px 0' }} />

      {/* Priorities */}
      {!collapsed && <div style={{ fontSize: 11, color: 'var(--ivp-nav-sep)', padding: '10px 14px 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Priority</div>}
      {config.priorities.map(p => (
        <NavItem key={p.id} label={p.name} active={navFilter === p.name}
          collapsed={collapsed} tooltip={p.name} colorDot={p.color} onClick={() => set(p.name)} />
      ))}

      <div style={{ borderTop: '1px solid var(--ivp-nav-sep)', margin: '6px 0' }} />

      {/* Categories */}
      {!collapsed && <div style={{ fontSize: 11, color: 'var(--ivp-nav-sep)', padding: '10px 14px 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Category</div>}
      {config.categories.map(c => (
        <NavItem key={c.id} icon="folder" label={c.name} active={navFilter === c.name}
          collapsed={collapsed} tooltip={c.name} onClick={() => set(c.name)} />
      ))}
    </div>
  )
}
