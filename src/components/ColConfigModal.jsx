// src/components/ColConfigModal.jsx
import { useApp } from '../lib/AppContext'
import { Modal, BtnPrimary, BtnGhost, Icon } from './UI'

export default function ColConfigModal({ open, onClose }) {
  const { state, dispatch } = useApp()
  const { config } = state

  function toggle(id) {
    const next = config.columns.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
    dispatch({ type: 'SET_CONFIG', payload: { columns: next } })
  }

  return (
    <Modal open={open} onClose={onClose} title="Configure Columns" width={420}
      footer={<BtnPrimary onClick={onClose}>Done</BtnPrimary>}>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Toggle columns on/off. Column widths can be adjusted by dragging the column edges in the table.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {config.columns.filter(c => !['draghandle', 'colorbar'].includes(c.id)).map(col => (
          <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
            border: '1px solid var(--ivp-border)', borderRadius: 4, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5ff'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <Icon name="drag_indicator" size={16} style={{ color: '#ccc' }} />
            <input type="checkbox" checked={col.visible} onChange={() => toggle(col.id)}
              style={{ accentColor: 'var(--ivp-primary)', width: 15, height: 15 }} />
            <span style={{ fontSize: 14 }}>{col.label || col.id}</span>
          </label>
        ))}
      </div>
    </Modal>
  )
}
