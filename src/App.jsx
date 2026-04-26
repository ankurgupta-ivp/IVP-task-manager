// src/App.jsx
import { useState, useEffect } from 'react'
import { useApp } from './lib/AppContext'
import { sb, isConfigured } from './lib/supabase'
import { useBootstrap } from './hooks/useBootstrap'
import { canEditTask, mapTask } from './lib/utils'

import LoginPage      from './pages/LoginPage'
import AdminPanel     from './pages/AdminPanel'
import TopBar         from './components/TopBar'
import LeftNav        from './components/LeftNav'
import QuickFilters   from './components/QuickFilters'
import TaskGrid       from './components/TaskGrid'
import TaskModal      from './components/TaskModal'
import ColConfigModal from './components/ColConfigModal'
import { TaskDetailPanel, ShareModal } from './components/TaskDetail'
import { LoadingOverlay, toast } from './components/UI'

export default function App() {
  const { state, dispatch } = useApp()
  const { currentUser, view } = state
  const boot = useBootstrap()

  const [loading,      setLoading]      = useState(true)
  const [hideCompleted,setHideCompleted]= useState(false)
  const [taskModalOpen,setTaskModalOpen]= useState(false)
  const [editingTask,  setEditingTask]  = useState(null)
  const [detailTask,   setDetailTask]   = useState(null)
  const [shareTask,    setShareTask]    = useState(null)
  const [colConfigOpen,setColConfigOpen]= useState(false)
  const [ctxMenu,      setCtxMenu]      = useState(null)  // { x, y, task }

  // Auto-login on mount
  useEffect(() => {
    async function init() {
      if (isConfigured()) {
        dispatch({ type: 'SET_DB_CONNECTED', payload: true })
        const saved = localStorage.getItem('ivp_session')
        if (saved) {
          try {
            const result = await sb.rpc('app_validate_session', { p_token: saved })
            if (result?.id) {
              dispatch({ type: 'SET_USER', payload: {
                user: { id:result.id, email:result.email, display_name:result.display_name,
                  initials:result.initials, avatar_color:result.avatar_color, role:result.role },
                token: saved,
              }})
              await boot()
              setLoading(false); return
            }
          } catch {}
          localStorage.removeItem('ivp_session')
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  // Close ctx menu on click
  useEffect(() => {
    const h = () => setCtxMenu(null)
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  // Sync hideCompleted to context
  useEffect(() => {
    dispatch({ type: 'SET_HIDE_COMPLETED', payload: hideCompleted })
  }, [hideCompleted])

  if (loading) return <LoadingOverlay show message="Starting up…" />
  if (!currentUser) return <LoginPage />

  function openNewTask() { setEditingTask(null); setTaskModalOpen(true) }
  function openEditTask(task) {
    if (!canEditTask(task, currentUser)) { toast('You can only edit tasks you created', 'error'); return }
    setEditingTask(task); setTaskModalOpen(true)
  }
  function openDetail(task) { setDetailTask(task) }
  function openShare(task)  { setShareTask(task) }

  async function deleteTask(task) {
    if (!canEditTask(task, currentUser)) { toast('Cannot delete this task', 'error'); return }
    if (!confirm(`Delete "${task.title}"?`)) return
    if (isConfigured()) {
      try { await sb.delete('tasks', task.id) } catch(e) { toast('Delete failed: '+e.message,'error'); return }
    }
    dispatch({ type: 'DELETE_TASK', payload: task.id })
    if (detailTask?.id === task.id) setDetailTask(null)
    toast('Task deleted', 'info')
  }

  function handleContextMenu(e, task) {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, task })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar hideCompleted={hideCompleted} onToggleHideCompleted={() => setHideCompleted(h => !h)}
        onOpenColConfig={() => setColConfigOpen(true)} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftNav />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {view === 'tasks' && (
            <>
              <QuickFilters onNewTask={openNewTask} hideCompleted={hideCompleted}
                onToggleHideCompleted={() => setHideCompleted(h => !h)} />
              <TaskGrid
                onEdit={openEditTask}
                onDetail={openDetail}
                onShare={openShare}
                onDelete={deleteTask}
                onContextMenu={handleContextMenu}
              />
            </>
          )}
          {view === 'admin' && <AdminPanel />}
        </div>
      </div>

      {/* Detail panel */}
      {detailTask && (
        <TaskDetailPanel task={detailTask} onClose={() => setDetailTask(null)} onEdit={openEditTask} />
      )}

      {/* Modals */}
      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} editTask={editingTask} />
      <ColConfigModal open={colConfigOpen} onClose={() => setColConfigOpen(false)} />
      {shareTask && <ShareModal open task={shareTask} onClose={() => setShareTask(null)} />}

      {/* Context menu */}
      {ctxMenu && (
        <div style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, background: '#fff',
          border: '1px solid var(--ivp-border)', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          zIndex: 500, minWidth: 160 }}>
          {[
            { icon: 'edit',         label: 'Edit Task',      action: () => openEditTask(ctxMenu.task), disabled: !canEditTask(ctxMenu.task, currentUser) },
            { icon: 'open_in_new',  label: 'View Details',   action: () => openDetail(ctxMenu.task) },
            { icon: 'share',        label: 'Share',          action: () => openShare(ctxMenu.task) },
            { icon: 'content_copy', label: 'Duplicate',      action: () => duplicateTask(ctxMenu.task) },
            { icon: 'check_circle', label: 'Mark Complete',  action: () => markDone(ctxMenu.task), disabled: !canEditTask(ctxMenu.task, currentUser) },
            { icon: 'delete',       label: 'Delete',         action: () => deleteTask(ctxMenu.task), danger: true, disabled: !canEditTask(ctxMenu.task, currentUser) },
          ].map(item => (
            <div key={item.label} onClick={item.disabled ? undefined : () => { item.action(); setCtxMenu(null) }}
              style={{ padding: '8px 14px', fontSize: 13, cursor: item.disabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                color: item.disabled ? '#ccc' : item.danger ? 'var(--ivp-status-failed)' : 'inherit' }}
              onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = item.danger ? '#fff0f0' : '#f5f5ff' }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  async function duplicateTask(task) {
    const copy = { ...task, title: 'Copy of ' + task.title, created_by: currentUser.id,
      sort_order: (state.tasks.length ? Math.min(...state.tasks.map(t=>t.sort_order||0)) - 1000 : 0) }
    if (isConfigured()) {
      try {
        const rows = await sb.insert('tasks', { title:copy.title, description:copy.desc, priority:copy.priority,
          status:'To Do', category:copy.category||null, assignee_id:copy.assignee||null, tags:copy.tags,
          start_date: new Date().toISOString().split('T')[0], created_by:currentUser.id, sort_order:copy.sort_order })
        if (rows?.[0]) { dispatch({ type:'UPSERT_TASK', payload: mapTask(rows[0]) }); toast('Duplicated','info'); return }
      } catch(e) { toast('Duplicate failed: '+e.message,'error'); return }
    }
    copy.id = 'tk'+Date.now()
    dispatch({ type:'UPSERT_TASK', payload: copy })
    toast('Duplicated (demo)','info')
  }

  async function markDone(task) {
    if (!canEditTask(task, currentUser)) { toast('Cannot update this task','error'); return }
    const updated = { ...task, status: 'Done' }
    if (isConfigured()) {
      try { await sb.update('tasks', task.id, { status:'Done' }) } catch(e) { toast('Update failed','error'); return }
    }
    dispatch({ type:'UPSERT_TASK', payload: updated })
    toast('Marked as Done','success')
  }
}
