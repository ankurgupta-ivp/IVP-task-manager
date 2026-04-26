// src/components/TaskModal.jsx
import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { sb, isConfigured } from '../lib/supabase'
import { mapTask, todayStr, canEditTask } from '../lib/utils'
import { Modal, Field, Input, Select, Textarea, BtnPrimary, BtnGhost, TagChip, SectionHeading, toast } from './UI'

export default function TaskModal({ open, onClose, editTask }) {
  const { state, dispatch } = useApp()
  const { config, appUsers, currentUser, tasks } = state

  const [title,     setTitle]     = useState('')
  const [desc,      setDesc]      = useState('')
  const [priority,  setPriority]  = useState('Medium')
  const [status,    setStatus]    = useState('To Do')
  const [category,  setCategory]  = useState('')
  const [assignee,  setAssignee]  = useState('')
  const [startdate, setStartdate] = useState(todayStr())
  const [duedate,   setDuedate]   = useState('')
  const [tags,      setTags]      = useState([])
  const [tagInput,  setTagInput]  = useState('')
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    if (!open) return
    if (editTask) {
      setTitle(editTask.title)
      setDesc(editTask.desc || '')
      setPriority(editTask.priority)
      setStatus(editTask.status)
      setCategory(editTask.category || '')
      setAssignee(editTask.assignee || '')
      setStartdate(editTask.startdate || todayStr())
      setDuedate(editTask.duedate || '')
      setTags(editTask.tags || [])
    } else {
      setTitle(''); setDesc(''); setPriority('Medium'); setStatus('To Do')
      setCategory(''); setAssignee(''); setStartdate(todayStr()); setDuedate('')
      setTags([])
    }
    setTagInput('')
  }, [open, editTask])

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.trim().replace(',', '')
      if (val && !tags.includes(val)) {
        setTags(prev => [...prev, val])
        if (!config.tags.find(t => t.name === val)) {
          dispatch({ type: 'SET_CONFIG', payload: { tags: [...config.tags, { id: 't' + Date.now(), name: val, color: '#404789' }] }})
        }
      }
      setTagInput('')
    }
    if (e.key === 'Backspace' && !tagInput && tags.length) setTags(prev => prev.slice(0, -1))
  }

  async function save() {
    if (!title.trim()) { toast('Title is required', 'error'); return }
    setSaving(true)
    const payload = {
      title: title.trim(), description: desc.trim(),
      priority, status, category: category || null,
      assignee_id: assignee || null,
      start_date: startdate || todayStr(),
      due_date: duedate || null,
      tags,
    }
    if (isConfigured()) {
      try {
        if (editTask) {
          const rows = await sb.update('tasks', editTask.id, payload)
          dispatch({ type: 'UPSERT_TASK', payload: mapTask(rows[0]) })
          toast('Task updated', 'success')
        } else {
          const minOrder = tasks.length ? Math.min(...tasks.map(t => t.sort_order || 0)) - 1000 : 0
          const rows = await sb.insert('tasks', { ...payload, created_by: currentUser.id, sort_order: minOrder })
          dispatch({ type: 'UPSERT_TASK', payload: mapTask(rows[0]) })
          toast('Task created', 'success')
        }
      } catch (e) { toast('Save failed: ' + e.message, 'error'); setSaving(false); return }
    } else {
      const task = {
        id: editTask?.id || 'tk' + Date.now(),
        title: payload.title, desc: payload.description,
        priority, status, category: category || '',
        assignee: assignee || '', tags,
        startdate: payload.start_date, duedate: payload.due_date || '',
        created: todayStr(), created_by: currentUser?.id || 'demo',
        sort_order: editTask?.sort_order ?? (tasks.length ? Math.min(...tasks.map(t => t.sort_order || 0)) - 1000 : 0),
      }
      dispatch({ type: 'UPSERT_TASK', payload: task })
      toast(editTask ? 'Updated (demo)' : 'Created (demo)', 'info')
    }
    setSaving(false); onClose()
  }

  const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' }

  return (
    <Modal open={open} onClose={onClose} width={660}
      title={editTask ? 'Edit Task' : 'New Task'}
      footer={<><BtnPrimary onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Task'}</BtnPrimary><BtnGhost onClick={onClose}>Cancel</BtnGhost></>}>

      <SectionHeading>Basic Info</SectionHeading>
      <div style={{ marginBottom: 14 }}>
        <Field label="Title" required style={{ marginBottom: 14 }}>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title…" autoFocus />
        </Field>
        <Field label="Description">
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Task description…" />
        </Field>
      </div>

      <SectionHeading>Details</SectionHeading>
      <div style={{ ...gridStyle, marginBottom: 14 }}>
        <Field label="Priority" required>
          <Select value={priority} onChange={e => setPriority(e.target.value)}>
            {config.priorities.map(p => <option key={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Status" required>
          <Select value={status} onChange={e => setStatus(e.target.value)}>
            {config.statuses.map(s => <option key={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Category">
          <Select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">— None —</option>
            {config.categories.map(c => <option key={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Assign To">
          <Select value={assignee} onChange={e => setAssignee(e.target.value)}>
            <option value="">— Unassigned —</option>
            {appUsers.map(u => <option key={u.id} value={u.id}>{u.display_name}</option>)}
          </Select>
        </Field>
        <Field label="Start Date">
          <Input type="date" value={startdate} onChange={e => setStartdate(e.target.value)} />
        </Field>
        <Field label="Due Date">
          <Input type="date" value={duedate} onChange={e => setDuedate(e.target.value)} />
        </Field>
      </div>

      <SectionHeading>Tags</SectionHeading>
      <div onClick={() => document.getElementById('tag-input-field')?.focus()}
        style={{ border: '1px solid var(--ivp-border-input)', borderRadius: 4, padding: '5px 8px',
          display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 38, cursor: 'text' }}>
        {tags.map((t, i) => <TagChip key={t} name={t} tags={config.tags} onRemove={() => setTags(prev => prev.filter((_, j) => j !== i))} />)}
        <input id="tag-input-field" value={tagInput} onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown} placeholder={tags.length ? '' : 'Type tag and press Enter…'}
          style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'var(--ivp-font)', minWidth: 80, flex: 1 }} />
      </div>
    </Modal>
  )
}
