// src/components/QuickFilters.jsx
import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Icon, TagChip, Modal, BtnPrimary, BtnGhost, Field, Input, Select } from './UI'

export default function QuickFilters({ onNewTask, hideCompleted, onToggleHideCompleted }) {
  const { state, dispatch } = useApp()
  const { activeQuickFilter, config, currentUser } = state
  const [manageOpen, setManageOpen] = useState(false)
  const [newLabel, setNewLabel]     = useState('')
  const [newFilter, setNewFilter]   = useState('')
  const [newType, setNewType]       = useState('preset')   // 'preset' | 'tag'
  const [newTagVal, setNewTagVal]   = useState('')

  const setQF = f => dispatch({ type: 'SET_QUICK_FILTER', payload: activeQuickFilter === f ? null : f })

  function addQuickFilter() {
    if (!newLabel.trim()) return
    const filterKey = newType === 'tag' ? newTagVal : newFilter
    if (!filterKey.trim()) return
    const item = { id: 'qf' + Date.now(), label: newLabel.trim(), filter: filterKey.trim() }
    dispatch({ type: 'SET_CONFIG', payload: { quickFilters: [...config.quickFilters, item] }})
    setNewLabel(''); setNewFilter(''); setNewTagVal('')
  }

  function removeQF(id) {
    dispatch({ type: 'SET_CONFIG', payload: { quickFilters: config.quickFilters.filter(q => q.id !== id) }})
  }

  const canCreate = currentUser?.role !== 'readonly'

  return (
    <>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--ivp-border)', padding: '6px 16px',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* New task button */}
        {canCreate && (
          <button onClick={onNewTask}
            style={{ background: 'var(--ivp-primary)', color: '#fff', border: 'none', borderRadius: 4,
              padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--ivp-font)',
              display: 'inline-flex', alignItems: 'center', gap: 5, marginRight: 8, flexShrink: 0 }}>
            <Icon name="add" size={15} /> New Task
          </button>
        )}

        <div style={{ width: 1, height: 20, background: 'var(--ivp-border)', flexShrink: 0 }} />

        <span style={{ fontSize: 12, color: '#999', flexShrink: 0 }}>Quick:</span>
        {config.quickFilters.map(qf => {
          const isTag = config.tags.some(t => t.name === qf.filter)
          const tagCfg = isTag ? config.tags.find(t => t.name === qf.filter) : null
          const active = activeQuickFilter === qf.filter
          return (
            <button key={qf.id} onClick={() => setQF(qf.filter)}
              style={{ fontSize: 12, padding: '3px 12px', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                border: `1px solid ${active ? 'var(--ivp-primary)' : tagCfg ? tagCfg.color : '#c4c4c4'}`,
                background: active ? 'var(--ivp-primary)' : tagCfg ? tagCfg.color + '18' : '#fff',
                color: active ? '#fff' : tagCfg ? tagCfg.color : 'var(--ivp-text-dark)',
                fontFamily: 'var(--ivp-font)' }}>
              {qf.label}
            </button>
          )
        })}

        <button onClick={() => setManageOpen(true)} title="Manage quick filters"
          style={{ background: 'none', border: '1px dashed #ccc', borderRadius: 12, padding: '3px 10px',
            fontSize: 12, cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Icon name="settings" size={13} /> Manage
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={onToggleHideCompleted}
            style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${hideCompleted ? 'var(--ivp-primary)' : '#c4c4c4'}`,
              background: hideCompleted ? '#eef0ff' : '#fff', color: hideCompleted ? 'var(--ivp-primary)' : '#666',
              fontFamily: 'var(--ivp-font)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name={hideCompleted ? 'visibility_off' : 'visibility'} size={13} />
            {hideCompleted ? 'Show Completed' : 'Hide Completed'}
          </button>
        </div>
      </div>

      {/* Manage Quick Filters Modal */}
      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Manage Quick Filters" width={520}
        footer={<BtnGhost onClick={() => setManageOpen(false)}>Close</BtnGhost>}>
        {/* Existing */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 8 }}>Current Quick Filters</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {config.quickFilters.map(qf => {
              const isTag = config.tags.some(t => t.name === qf.filter)
              const tagCfg = isTag ? config.tags.find(t => t.name === qf.filter) : null
              return (
                <div key={qf.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  border: '1px solid var(--ivp-border)', borderRadius: 4, background: tagCfg ? tagCfg.color + '10' : '#fff' }}>
                  <span style={{ flex: 1, fontSize: 14 }}>{qf.label}</span>
                  {isTag && <TagChip name={qf.filter} tags={config.tags} />}
                  {!isTag && <span style={{ fontSize: 11, color: '#aaa', background: '#f0f0f0', padding: '1px 6px', borderRadius: 3 }}>{qf.filter}</span>}
                  <button onClick={() => removeQF(qf.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex' }}>
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Add new */}
        <div style={{ borderTop: '1px solid var(--ivp-border)', paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 10 }}>Add New Quick Filter</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 12 }}>
            <Field label="Label (shown on button)">
              <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. 🐛 Bugs" />
            </Field>
            <Field label="Filter type">
              <Select value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="preset">Preset filter</option>
                <option value="tag">Tag filter</option>
              </Select>
            </Field>
            {newType === 'tag' ? (
              <Field label="Tag" style={{ gridColumn: '1/-1' }}>
                <Select value={newTagVal} onChange={e => setNewTagVal(e.target.value)}>
                  <option value="">— Select tag —</option>
                  {config.tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </Select>
              </Field>
            ) : (
              <Field label="Filter key" style={{ gridColumn: '1/-1' }}>
                <Select value={newFilter} onChange={e => setNewFilter(e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="all">All</option>
                  <option value="urgent">Urgent priority</option>
                  <option value="today">Due Today</option>
                  <option value="week">Due This Week</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                  {config.categories.map(c => <option key={c.id} value={c.name}>{c.name} (category)</option>)}
                </Select>
              </Field>
            )}
          </div>
          <BtnPrimary onClick={addQuickFilter}>
            <Icon name="add" size={14} /> Add Filter
          </BtnPrimary>
        </div>
      </Modal>
    </>
  )
}
