// src/components/TaskGrid.jsx
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { sb } from '../lib/supabase'
import { canSeeTask, canEditTask, isOverdue, isDueToday, fmtDate, priorityOrder } from '../lib/utils'
import { PriorityBadge, StatusBadge, TagChip, AssigneeAvatar, Icon, BtnGhost, toast } from './UI'

// ── Column filter dropdowns ──────────────────────────────────
function ColFilterDropdown({ colId, options, filterState, onChange, onClose, anchorRect }) {
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const isTextCol = ['title', 'desc', 'category'].includes(colId)
  const [text, setText] = useState(filterState?.text || '')

  const style = {
    position: 'fixed', background: '#fff', border: '1px solid var(--ivp-border)',
    borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.14)', zIndex: 900,
    minWidth: 180, maxWidth: 260, padding: '8px 0',
    top: (anchorRect?.bottom ?? 100) + 4,
    left: Math.min(anchorRect?.left ?? 100, window.innerWidth - 270),
  }

  if (isTextCol) {
    return (
      <div ref={ref} style={style}>
        <div style={{ padding: '6px 12px', fontSize: 12, color: '#999', borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
          Filter by {colId}
        </div>
        <div style={{ padding: '6px 12px' }}>
          <input autoFocus value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { onChange({ text }); onClose() } if (e.key === 'Escape') onClose() }}
            placeholder="Type and press Enter…"
            style={{ width: '100%', border: '1px solid var(--ivp-border-input)', borderRadius: 4,
              padding: '6px 8px', fontSize: 13, outline: 'none' }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={() => { onChange({ text }); onClose() }}
              style={{ flex: 1, background: 'var(--ivp-primary)', color: '#fff', border: 'none',
                borderRadius: 4, padding: '5px 0', fontSize: 12, cursor: 'pointer' }}>Apply</button>
            <button onClick={() => { onChange(null); onClose() }}
              style={{ background: 'transparent', border: '1px solid #ccc', borderRadius: 4,
                padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>Clear</button>
          </div>
        </div>
      </div>
    )
  }

  // Multi-select checkbox filter
  const selected = filterState?.values || []
  const toggle = val => {
    const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]
    onChange(next.length ? { values: next } : null)
  }

  return (
    <div ref={ref} style={style}>
      <div style={{ padding: '6px 12px', fontSize: 12, color: '#999', borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
        Filter by {colId}
      </div>
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {options.map(opt => (
          <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)}
              style={{ accentColor: 'var(--ivp-primary)' }} />
            {opt.node || <span style={{ fontSize: 13 }}>{opt.label}</span>}
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <div style={{ padding: '6px 12px', borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
          <button onClick={() => onChange(null)}
            style={{ fontSize: 12, color: 'var(--ivp-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear filter
          </button>
        </div>
      )}
    </div>
  )
}

// ── Column header with sort + filter ────────────────────────
function ColHeader({ col, sortKey, sortDir, onSort, colFilter, onFilterChange, filterOptions, width }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const filterBtnRef = useRef(null)
  const isFixed = ['draghandle', 'colorbar', 'actions'].includes(col.id)
  const hasFilter = colFilter && (colFilter.text || (colFilter.values && colFilter.values.length))

  function openFilter(e) {
    e.stopPropagation()
    setAnchorRect(filterBtnRef.current?.getBoundingClientRect())
    setFilterOpen(true)
  }

  if (isFixed) return (
    <th style={{ width, minWidth: width, padding: '8px 4px', background: '#f5f5f5',
      borderBottom: '1px solid #d0d0d0', fontWeight: 500, color: '#444', fontSize: 13, position: 'sticky', top: 0, zIndex: 2 }} />
  )

  return (
    <th style={{ width, minWidth: 60, background: '#f5f5f5', borderBottom: '1px solid #d0d0d0',
      fontSize: 13, fontWeight: 500, color: '#444', padding: '0', textAlign: 'left',
      position: 'sticky', top: 0, zIndex: 2, userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 4px 0 12px', height: 36 }}>
        <span onClick={() => onSort(col.id)} style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
          {col.label}
          {sortKey === col.id && <span style={{ fontSize: 10, color: 'var(--ivp-primary)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
        </span>
        <button ref={filterBtnRef} onClick={openFilter}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
            borderRadius: 3, color: hasFilter ? 'var(--ivp-primary)' : '#aaa',
            display: 'flex', alignItems: 'center' }}
          title="Filter column">
          <Icon name={hasFilter ? 'filter_alt' : 'filter_list'} size={14} />
        </button>
      </div>
      {filterOpen && (
        <ColFilterDropdown colId={col.id} options={filterOptions} filterState={colFilter}
          onChange={onFilterChange} onClose={() => setFilterOpen(false)} anchorRect={anchorRect} />
      )}
    </th>
  )
}

// ── Resize handle ─────────────────────────────────────────
function ResizeHandle({ onResize }) {
  const dragging = useRef(false)
  const startX   = useRef(0)

  function onMouseDown(e) {
    e.preventDefault()
    dragging.current = true
    startX.current   = e.clientX
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }
  function onMove(e) {
    if (!dragging.current) return
    onResize(e.clientX - startX.current)
    startX.current = e.clientX
  }
  function onUp() {
    dragging.current = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup',   onUp)
  }
  return (
    <div onMouseDown={onMouseDown}
      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize',
        background: 'transparent', zIndex: 3 }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(64,71,137,0.3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'} />
  )
}

// ── Main TaskGrid ─────────────────────────────────────────
export default function TaskGrid({ onEdit, onDetail, onShare, onDelete, onContextMenu }) {
  const { state, dispatch } = useApp()
  const { tasks, taskShares, appUsers, config, currentUser, navFilter, activeQuickFilter, hideCompleted } = state

  // Sort
  const [sortKey, setSortKey] = useState('manual')
  const [sortDir, setSortDir] = useState('asc')

  // Per-column filters  { colId: { text? values? } }
  const [colFilters, setColFilters] = useState({})

  // Column widths
  const [colWidths, setColWidths] = useState({
    draghandle: 28, colorbar: 6, title: 220, priority: 100, status: 120,
    category: 100, assignee: 150, tags: 160, startdate: 110, duedate: 110,
    desc: 200, shared: 120, actions: 90,
  })

  // Pagination
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Search (lifted from toolbar via prop — passed down)
  const [search, setSearch] = useState('')

  // Drag state
  const dragSrcId  = useRef(null)
  const saveTimer  = useRef(null)
  const pending    = useRef({})

  const [dragOver, setDragOver]   = useState(null)   // {id, pos: 'top'|'bottom'}
  const [draggingId, setDraggingId] = useState(null)
  const [savingOrder, setSavingOrder] = useState(false)

  const isManual = sortKey === 'manual'

  // ── helpers ──────────────────────────────────────────────
  const getMember  = id  => appUsers.find(u => u.id === id)
  const getRowRule = task => config.colorRules.find(r =>
    (r.type === 'status' && task.status === r.value) ||
    (r.type === 'priority' && task.priority === r.value) ||
    (r.type === 'tag' && (task.tags || []).includes(r.value))
  )

  // ── filter options per column ────────────────────────────
  const filterOptions = useMemo(() => ({
    priority: config.priorities.map(p => ({
      value: p.name,
      node: <PriorityBadge name={p.name} />,
      label: p.name,
    })),
    status: config.statuses.map(s => ({
      value: s.name,
      node: <StatusBadge name={s.name} statuses={config.statuses} />,
      label: s.name,
    })),
    category: config.categories.map(c => ({ value: c.name, label: c.name })),
    assignee: appUsers.map(u => ({
      value: u.id,
      node: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: u.avatar_color || '#404789',
          color: '#fff', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {u.initials}
        </span>
        <span style={{ fontSize: 13 }}>{u.display_name}</span>
      </span>,
      label: u.display_name,
    })),
    tags: config.tags.map(t => ({
      value: t.name,
      node: <TagChip name={t.name} tags={config.tags} />,
      label: t.name,
    })),
    startdate: [], duedate: [],   // date range handled as text
    title: [], desc: [],          // free text
    shared: appUsers.map(u => ({ value: u.id, label: u.display_name })),
  }), [config, appUsers])

  // ── apply all filters ────────────────────────────────────
  const filtered = useMemo(() => {
    let list = tasks.filter(t => canSeeTask(t, currentUser, taskShares))

    if (hideCompleted) list = list.filter(t => t.status !== 'Done' && t.status !== 'Completed')

    // nav filter
    if (navFilter === 'today')    list = list.filter(isDueToday)
    else if (navFilter === 'week')     list = list.filter(t => {
      if (!t.duedate) return false
      const d = new Date(t.duedate), now = new Date()
      const s = new Date(now); s.setDate(now.getDate() - now.getDay())
      const e = new Date(s);   e.setDate(s.getDate() + 6)
      return d >= s && d <= e
    })
    else if (navFilter === 'overdue')  list = list.filter(isOverdue)
    else if (navFilter === 'mine')     list = list.filter(t => t.created_by === currentUser?.id)
    else if (navFilter === 'assigned') list = list.filter(t => t.assignee === currentUser?.id)
    else if (navFilter === 'shared')   list = list.filter(t => (taskShares[t.id] || []).includes(currentUser?.id))
    else if (navFilter && navFilter !== 'all')
      list = list.filter(t => t.priority === navFilter || t.category === navFilter)

    // quick filter
    const qf = activeQuickFilter
    if (qf && qf !== 'all') {
      if (qf === 'urgent')    list = list.filter(t => t.priority === 'Urgent')
      if (qf === 'today')     list = list.filter(isDueToday)
      if (qf === 'week')      list = list.filter(t => { const d = new Date(t.duedate), now = new Date(); const s = new Date(now); s.setDate(now.getDate()-now.getDay()); const e = new Date(s); e.setDate(s.getDate()+6); return d>=s&&d<=e })
      if (qf === 'overdue')   list = list.filter(isOverdue)
      if (qf === 'completed') list = list.filter(t => t.status === 'Done')
      // tag filter
      if (!['urgent','today','week','overdue','completed'].includes(qf))
        list = list.filter(t => (t.tags || []).includes(qf))
    }

    // global search
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.desc || '').toLowerCase().includes(q) ||
        (t.tags || []).some(tg => tg.toLowerCase().includes(q))
      )
    }

    // per-column filters
    Object.entries(colFilters).forEach(([colId, f]) => {
      if (!f) return
      if (f.text) {
        const q = f.text.toLowerCase()
        list = list.filter(t => {
          if (colId === 'title')    return t.title.toLowerCase().includes(q)
          if (colId === 'desc')     return (t.desc || '').toLowerCase().includes(q)
          if (colId === 'category') return (t.category || '').toLowerCase().includes(q)
          return true
        })
      }
      if (f.values && f.values.length) {
        list = list.filter(t => {
          if (colId === 'priority')  return f.values.includes(t.priority)
          if (colId === 'status')    return f.values.includes(t.status)
          if (colId === 'category')  return f.values.includes(t.category)
          if (colId === 'assignee')  return f.values.includes(t.assignee)
          if (colId === 'tags')      return (t.tags || []).some(tg => f.values.includes(tg))
          if (colId === 'shared')    return (taskShares[t.id] || []).some(uid => f.values.includes(uid))
          return true
        })
      }
    })

    return list
  }, [tasks, taskShares, currentUser, hideCompleted, navFilter, activeQuickFilter, search, colFilters])

  // ── sort ─────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (sortKey === 'manual') return [...filtered].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    return [...filtered].sort((a, b) => {
      let va, vb
      if (sortKey === 'priority')  { va = priorityOrder(a.priority, config.priorities); vb = priorityOrder(b.priority, config.priorities) }
      else if (sortKey === 'title')    { va = a.title;    vb = b.title }
      else if (sortKey === 'status')   { va = a.status;   vb = b.status }
      else if (sortKey === 'duedate')  { va = a.duedate || '9999'; vb = b.duedate || '9999' }
      else if (sortKey === 'startdate'){ va = a.startdate || '9999'; vb = b.startdate || '9999' }
      else if (sortKey === 'category') { va = a.category; vb = b.category }
      else { va = a[sortKey]; vb = b[sortKey] }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir, config.priorities])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const pageData   = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  function handleSort(colId) {
    if (colId === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(colId); setSortDir('asc') }
  }

  // ── drag & drop ──────────────────────────────────────────
  function onDragStart(e, id) {
    if (!isManual) { e.preventDefault(); return }
    dragSrcId.current = id
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
  function onDragOver(e, id) {
    if (!isManual || !dragSrcId.current || id === dragSrcId.current) return
    e.preventDefault()
    const rect  = e.currentTarget.getBoundingClientRect()
    const pos   = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom'
    setDragOver({ id, pos })
  }
  function onDrop(e, targetId) {
    e.preventDefault()
    setDragOver(null); setDraggingId(null)
    if (!dragSrcId.current || dragSrcId.current === targetId) return
    const src = dragSrcId.current
    dragSrcId.current = null
    const insertBefore = dragOver?.pos === 'top'
    doReorder(src, targetId, insertBefore)
  }
  function onDragEnd() { setDragOver(null); setDraggingId(null); dragSrcId.current = null }

  function doReorder(srcId, targetId, insertBefore) {
    const list = [...sorted]
    const targetIdx = list.findIndex(t => t.id === targetId)
    if (targetIdx === -1) return

    let newOrder
    if (insertBefore) {
      const prev = list[targetIdx - 1]
      newOrder = prev ? (prev.sort_order + list[targetIdx].sort_order) / 2 : list[targetIdx].sort_order - 1000
    } else {
      const next = list[targetIdx + 1]
      newOrder = next ? (list[targetIdx].sort_order + next.sort_order) / 2 : list[targetIdx].sort_order + 1000
    }

    // Check precision
    const minGap = list.reduce((min, t, i) => i === 0 ? min : Math.min(min, Math.abs(t.sort_order - list[i-1].sort_order)), Infinity)
    const updates = []
    if (minGap < 0.01) {
      list.forEach((t, i) => { t.sort_order = (i + 1) * 1000 })
      updates.push(...list.map(t => ({ id: t.id, sort_order: t.sort_order })))
    }
    const srcTask = tasks.find(t => t.id === srcId)
    if (srcTask) { srcTask.sort_order = newOrder; updates.push({ id: srcId, sort_order: newOrder }) }
    dispatch({ type: 'SET_TASKS', payload: [...tasks] })
    updates.forEach(({ id, sort_order }) => { pending.current[id] = sort_order })
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flushSave, 800)
    setSavingOrder(true)
  }

  async function flushSave() {
    const items = Object.entries(pending.current).map(([id, sort_order]) => ({ id, sort_order }))
    pending.current = {}
    try {
      await Promise.all(items.map(({ id, sort_order }) => sb.update('tasks', id, { sort_order })))
    } catch (e) { toast('Order save failed: ' + e.message, 'error') }
    setSavingOrder(false)
  }

  // ── column width resize ──────────────────────────────────
  function resizeCol(colId, delta) {
    setColWidths(prev => ({ ...prev, [colId]: Math.max(50, (prev[colId] || 120) + delta) }))
  }

  // ── render cell ──────────────────────────────────────────
  function renderCell(col, task, rule) {
    const editable = canEditTask(task, currentUser)
    const ov = isOverdue(task), dt = isDueToday(task) && !ov
    switch (col.id) {
      case 'draghandle': return (
        <td key="dh" style={{ padding: '0 4px 0 8px', width: colWidths.draghandle, color: isManual ? '#ccc' : '#eee', cursor: isManual ? 'grab' : 'default' }}>
          {isManual && <Icon name="drag_indicator" size={18} />}
        </td>
      )
      case 'colorbar': return (
        <td key="cb" style={{ padding: 0, width: 6 }}>
          <div style={{ width: 4, minHeight: 36, borderLeft: `4px solid ${rule?.bg || 'transparent'}` }} />
        </td>
      )
      case 'title': return (
        <td key="title" style={{ padding: '7px 12px', maxWidth: colWidths.title, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: rule?.text }}>
          <span style={{ color: ov ? 'var(--ivp-status-failed)' : dt ? 'var(--ivp-status-warn)' : undefined, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span title={task.title}>{task.title}</span>
            {(taskShares[task.id]?.length > 0) && <Icon name="group" size={13} style={{ color: '#888', flexShrink: 0 }} />}
          </span>
        </td>
      )
      case 'priority': return <td key="priority" style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}><PriorityBadge name={task.priority} /></td>
      case 'status':   return <td key="status"   style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}><StatusBadge name={task.status} statuses={config.statuses} /></td>
      case 'category': return <td key="category" style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>{task.category || '—'}</td>
      case 'assignee': return (
        <td key="assignee" style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
          <AssigneeAvatar user={getMember(task.assignee)} />
          {getMember(task.assignee) && <span style={{ marginLeft: 6, fontSize: 13 }}>{getMember(task.assignee).display_name}</span>}
        </td>
      )
      case 'tags': return (
        <td key="tags" style={{ padding: '7px 12px', maxWidth: colWidths.tags || 160 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {(task.tags || []).map(tg => <TagChip key={tg} name={tg} tags={config.tags} />)}
          </div>
        </td>
      )
      case 'startdate': return <td key="sd" style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>{fmtDate(task.startdate)}</td>
      case 'duedate': return (
        <td key="dd" style={{ padding: '7px 12px', whiteSpace: 'nowrap', color: ov ? 'var(--ivp-status-failed)' : dt ? 'var(--ivp-status-warn)' : undefined, fontWeight: (ov||dt) ? 500 : undefined }}>
          {fmtDate(task.duedate)}{ov ? ' ⚠' : dt ? ' ●' : ''}
        </td>
      )
      case 'desc': return (
        <td key="desc" style={{ padding: '7px 12px', maxWidth: colWidths.desc || 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={task.desc}>{task.desc || '—'}</td>
      )
      case 'shared': {
        const shares = taskShares[task.id] || []
        if (!shares.length) return <td key="shared" style={{ padding: '7px 12px', color: '#aaa' }}>—</td>
        const names = shares.map(uid => getMember(uid)?.initials || '?').join(', ')
        return (
          <td key="shared" style={{ padding: '7px 12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#555',
              background: '#f0f0ff', border: '1px solid #d0d0ff', borderRadius: 10, padding: '2px 7px' }}>
              <Icon name="group" size={12} />{names}
            </span>
          </td>
        )
      }
      case 'actions': return (
        <td key="actions" style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>
          {editable && <button onClick={() => onEdit(task)} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 3, padding: '2px 7px', fontSize: 11, cursor: 'pointer', marginRight: 3 }}>Edit</button>}
          <button onClick={() => onDetail(task)} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 3, padding: '2px 7px', fontSize: 11, cursor: 'pointer', marginRight: 3 }}>View</button>
          {editable && <button onClick={() => onDelete(task)} style={{ background: 'none', border: '1px solid #fcc', borderRadius: 3, padding: '2px 7px', fontSize: 11, cursor: 'pointer', color: '#d32f2f' }}>Del</button>}
        </td>
      )
      default: return <td key={col.id} style={{ padding: '7px 12px' }}>—</td>
    }
  }

  const visibleCols = config.columns.filter(c => c.visible)
  const activeFiltersCount = Object.values(colFilters).filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Search + sort bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--ivp-border)', padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--ivp-border-input)',
          borderRadius: 4, padding: '5px 10px', background: '#fff', minWidth: 220 }}>
          <Icon name="search" size={16} style={{ color: '#999' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search tasks…"
            style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'var(--ivp-font)', width: '100%' }} />
          {search && <Icon name="close" size={14} style={{ color: '#aaa', cursor: 'pointer' }} onClick={() => setSearch('')} />}
        </div>

        {activeFiltersCount > 0 && (
          <button onClick={() => setColFilters({})}
            style={{ fontSize: 12, color: 'var(--ivp-primary)', background: '#eef0ff', border: '1px solid #c8ccf0',
              borderRadius: 10, padding: '3px 10px', cursor: 'pointer' }}>
            ✕ Clear {activeFiltersCount} column filter{activeFiltersCount > 1 ? 's' : ''}
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          <span style={{ fontSize: 12, color: '#999' }}>Sort:</span>
          <select value={sortKey} onChange={e => { setSortKey(e.target.value); setPage(1) }}
            style={{ border: '1px solid var(--ivp-border-input)', borderRadius: 4, padding: '4px 24px 4px 8px',
              fontSize: 12, fontFamily: 'var(--ivp-font)', outline: 'none', appearance: 'none',
              background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E") right 6px center no-repeat #fff` }}>
            <option value="manual">✦ Manual Order</option>
            <option value="duedate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="title">Title A–Z</option>
            <option value="category">Category</option>
          </select>
          {sortKey !== 'manual' && (
            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              style={{ background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '3px 8px', fontSize: 12, cursor: 'pointer' }}>
              {sortDir === 'asc' ? '▲ Asc' : '▼ Desc'}
            </button>
          )}
          {isManual && <span style={{ fontSize: 11, color: 'var(--ivp-primary)', background: '#eef0ff', border: '1px solid #c8ccf0', borderRadius: 10, padding: '2px 8px' }}>⠿ Drag to reorder</span>}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#999' }}>Rows:</span>
          <select value={pageSize} onChange={e => { setPageSize(+e.target.value); setPage(1) }}
            style={{ border: '1px solid var(--ivp-border-input)', borderRadius: 4, padding: '4px 24px 4px 8px',
              fontSize: 12, fontFamily: 'var(--ivp-font)', outline: 'none', appearance: 'none',
              background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E") right 6px center no-repeat #fff` }}>
            {[25, 50, 100].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Blotter */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Header bar */}
          <div style={{ background: 'var(--ivp-widget-header)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--ivp-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ivp-heading)' }}>Task Blotter</span>
              <span style={{ fontSize: 12, color: '#999' }}>({sorted.length} task{sorted.length !== 1 ? 's' : ''})</span>
              {savingOrder && <span style={{ fontSize: 11, color: 'var(--ivp-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, border: '2px solid #c8ccf0', borderTopColor: 'var(--ivp-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Saving order…
              </span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <BtnGhost onClick={() => { setColFilters({}); setSearch('') }} style={{ fontSize: 12, padding: '3px 8px' }}>Clear Filters</BtnGhost>
              <BtnGhost onClick={exportCSV} style={{ fontSize: 12, padding: '3px 8px' }}>⬇ Export CSV</BtnGhost>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {visibleCols.map(col => (
                    <th key={col.id} style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f5f5f5',
                      borderBottom: '1px solid #d0d0d0', padding: 0, width: colWidths[col.id] || 'auto' }}>
                      <div style={{ position: 'relative' }}>
                        <ColHeader col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}
                          colFilter={colFilters[col.id]} filterOptions={filterOptions[col.id] || []}
                          onFilterChange={f => { setColFilters(prev => ({ ...prev, [col.id]: f })); setPage(1) }}
                          width={colWidths[col.id]} />
                        {!['draghandle','colorbar','actions'].includes(col.id) && (
                          <ResizeHandle onResize={delta => resizeCol(col.id, delta)} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr><td colSpan={visibleCols.length}>
                    <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
                      <Icon name="inbox" size={48} style={{ color: '#d0d0d0', display: 'block', margin: '0 auto 12px' }} />
                      No tasks found
                    </div>
                  </td></tr>
                ) : pageData.map((task, idx) => {
                  const rule = getRowRule(task)
                  const isComp = task.status === 'Done' || task.status === 'Completed'
                  const isDragging = draggingId === task.id
                  const isOver = dragOver?.id === task.id

                  return (
                    <tr key={task.id}
                      draggable={isManual}
                      onDragStart={e => onDragStart(e, task.id)}
                      onDragOver={e => onDragOver(e, task.id)}
                      onDragEnter={e => e.preventDefault()}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => onDrop(e, task.id)}
                      onDragEnd={onDragEnd}
                      onDoubleClick={() => onDetail(task)}
                      onContextMenu={e => { e.preventDefault(); onContextMenu(e, task) }}
                      style={{
                        background: isDragging ? '#e8ecff' : rule ? rule.bg : idx % 2 === 1 ? 'var(--ivp-row-alt)' : '#fff',
                        opacity: isDragging ? 0.4 : 1,
                        borderTop: isOver && dragOver.pos === 'top'    ? '2px solid var(--ivp-primary)' : undefined,
                        borderBottom: isOver && dragOver.pos === 'bottom' ? '2px solid var(--ivp-primary)' : undefined,
                        textDecoration: isComp ? 'line-through' : undefined,
                        cursor: isManual ? 'grab' : 'default',
                      }}
                      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = '#f0f4ff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = isDragging ? '#e8ecff' : rule ? rule.bg : idx % 2 === 1 ? 'var(--ivp-row-alt)' : '#fff' }}>
                      {visibleCols.map(col => renderCell(col, task, rule))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px',
            fontSize: 12, color: '#666', borderTop: '1px solid var(--ivp-border)', background: '#fafafa' }}>
            <span>Showing {(safePage-1)*pageSize+1}–{Math.min(safePage*pageSize, sorted.length)} of {sorted.length}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                style={{ border: '1px solid #ccc', background: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>‹ Prev</button>
              <span>Page {safePage}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                style={{ border: '1px solid #ccc', background: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>Next ›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  function exportCSV() {
    const cols = ['title','priority','status','category','assignee','tags','startdate','duedate','desc']
    const hdr  = cols.join(',')
    const rows = filtered.map(t => cols.map(c => {
      let v = c === 'assignee' ? (getMember(t.assignee)?.display_name || '') : c === 'tags' ? (t.tags || []).join(';') : (t[c] || '')
      return `"${String(v).replace(/"/g, '""')}"`
    }).join(','))
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent([hdr, ...rows].join('\n'))
    a.download = 'tasks.csv'; a.click()
  }
}
