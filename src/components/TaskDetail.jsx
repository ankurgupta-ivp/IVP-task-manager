// src/components/TaskDetail.jsx
import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { sb, isConfigured } from '../lib/supabase'
import { canEditTask, fmtDate, isOverdue } from '../lib/utils'
import { Icon, PriorityBadge, StatusBadge, TagChip, AssigneeAvatar, BtnPrimary, BtnGhost, Toggle, Modal, toast } from './UI'

/* ─── Detail slide panel ──────────────────────────────── */
export function TaskDetailPanel({ task, onClose, onEdit }) {
  const { state } = useApp()
  const { config, appUsers, taskShares, currentUser } = state
  const [shareOpen, setShareOpen] = useState(false)

  if (!task) return null

  const creator = appUsers.find(u => u.id === task.created_by)
  const shares  = taskShares[task.id] || []
  const sharedUsers = shares.map(uid => appUsers.find(u => u.id === uid)).filter(Boolean)
  const canEdit = canEditTask(task, currentUser)

  const row = (label, value) => (
    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: '#666', width: 120, flexShrink: 0, paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 14, flex: 1 }}>{value}</div>
    </div>
  )

  return (
    <>
      <div style={{ position: 'fixed', right: 0, top: 48, bottom: 0, width: 400, background: '#fff',
        borderLeft: '1px solid var(--ivp-border)', boxShadow: '-2px 0 12px rgba(0,0,0,0.08)', zIndex: 200,
        display: 'flex', flexDirection: 'column', animation: 'slideIn 0.22s ease' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--ivp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ivp-heading)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex' }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {row('Priority',    <PriorityBadge name={task.priority} />)}
          {row('Status',      <StatusBadge name={task.status} statuses={config.statuses} />)}
          {row('Category',    task.category || '—')}
          {row('Assigned To', <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AssigneeAvatar user={appUsers.find(u => u.id === task.assignee)} /><span>{appUsers.find(u=>u.id===task.assignee)?.display_name||'—'}</span></span>)}
          {row('Created By',  creator ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AssigneeAvatar user={creator} /><span>{creator.display_name}</span></span> : '—')}
          {row('Start Date',  fmtDate(task.startdate))}
          {row('Due Date',    <span style={{ color: isOverdue(task) ? 'var(--ivp-status-failed)' : undefined }}>{fmtDate(task.duedate)}{isOverdue(task) ? ' ⚠ Overdue' : ''}</span>)}
          {row('Tags',        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(task.tags||[]).map(t=><TagChip key={t} name={t} tags={config.tags}/>)}</div> || '—')}
          {row('Shared With', sharedUsers.length
            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{sharedUsers.map(u=><span key={u.id} style={{ display:'flex',alignItems:'center',gap:4,fontSize:13 }}><AssigneeAvatar user={u}/><span>{u.display_name}</span></span>)}</div>
            : '—')}
          {task.desc && row('Description', <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{task.desc}</div>)}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--ivp-border)', display: 'flex', gap: 8 }}>
          {canEdit && <BtnPrimary onClick={() => { onClose(); onEdit(task) }}>Edit Task</BtnPrimary>}
          <BtnGhost onClick={() => setShareOpen(true)}><Icon name="share" size={15} /> Share</BtnGhost>
          <BtnGhost onClick={onClose}>Close</BtnGhost>
        </div>
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} task={task} />
    </>
  )
}

/* ─── Share modal ─────────────────────────────────────── */
export function ShareModal({ open, onClose, task }) {
  const { state, dispatch } = useApp()
  const { appUsers, taskShares, currentUser } = state
  const [pending, setPending] = useState([])

  // init pending from current shares when modal opens
  const onOpen = () => setPending([...(taskShares[task?.id] || [])])

  const otherUsers = appUsers.filter(u => u.id !== currentUser?.id && u.id !== task?.created_by)

  async function save() {
    if (!task) return
    const prev    = taskShares[task.id] || []
    const toAdd   = pending.filter(id => !prev.includes(id))
    const toRemove= prev.filter(id => !pending.includes(id))

    if (isConfigured()) {
      try {
        await Promise.all([
          ...toAdd.map(uid => sb.insert('task_shares', { task_id: task.id, shared_with_user_id: uid, shared_by: currentUser.id })),
          ...toRemove.map(uid => sb.deleteWhere('task_shares', { task_id: `eq.${task.id}`, shared_with_user_id: `eq.${uid}` })),
        ])
      } catch (e) { toast('Share failed: ' + e.message, 'error'); return }
    }
    dispatch({ type: 'SET_SHARES', taskId: task.id, payload: [...pending] })
    onClose(); toast('Sharing updated', 'success')
  }

  function toggle(uid) {
    setPending(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])
  }

  return (
    <Modal open={open} onClose={onClose} title={`Share — ${task?.title || ''}`} width={480}
      onAfterOpen={onOpen}
      footer={<><BtnPrimary onClick={save}>Save Sharing</BtnPrimary><BtnGhost onClick={onClose}>Cancel</BtnGhost></>}>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Select users who can see this task. They will find it under "Shared with Me".
      </p>
      {otherUsers.length === 0 && <p style={{ color: '#aaa', fontSize: 13 }}>No other users to share with.</p>}
      {otherUsers.map(u => (
        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
          borderBottom: '1px solid #f5f5f5' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.avatar_color || '#404789',
            color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {u.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{u.display_name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{u.email}</div>
          </div>
          <Toggle on={pending.includes(u.id)} onChange={() => toggle(u.id)} />
        </div>
      ))}
    </Modal>
  )
}
