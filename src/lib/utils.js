// src/lib/utils.js

export const todayStr = () => new Date().toISOString().split('T')[0]
export const daysAgo  = n => new Date(Date.now() - n * 86400000).toISOString().split('T')[0]
export const daysAhead= n => new Date(Date.now() + n * 86400000).toISOString().split('T')[0]

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function isOverdue(task) {
  if (!task.duedate) return false
  if (task.status === 'Done' || task.status === 'Completed') return false
  return task.duedate < todayStr()
}

export function isDueToday(task) { return task.duedate === todayStr() }

export function isDueThisWeek(task) {
  if (!task.duedate) return false
  const d = new Date(task.duedate)
  const now = new Date()
  const start = new Date(now); start.setDate(now.getDate() - now.getDay())
  const end   = new Date(start); end.setDate(start.getDate() + 6)
  return d >= start && d <= end
}

export function priorityOrder(name, priorities) {
  const idx = priorities.findIndex(p => p.name === name)
  return idx === -1 ? 99 : idx
}

// ── DB row mappers ──────────────────────────────────────
export function mapTask(r) {
  return {
    id:         r.id,
    title:      r.title,
    desc:       r.description || '',
    priority:   r.priority,
    status:     r.status,
    category:   r.category || '',
    assignee:   r.assignee_id || '',
    tags:       r.tags || [],
    startdate:  r.start_date || '',
    duedate:    r.due_date || '',
    created:    (r.created_at || '').split('T')[0],
    created_by: r.created_by || '',
    sort_order: r.sort_order ?? 0,
  }
}

export function mapAppUser(r) {
  return {
    id:           r.id,
    email:        r.email,
    display_name: r.display_name,
    name:         r.display_name,
    initials:     r.initials,
    avatar_color: r.avatar_color,
    color:        r.avatar_color,
    role:         r.role,
    is_active:    r.is_active,
  }
}

export function mapStatus(r)      { return { id: r.id, name: r.name, color: r.color, textColor: r.text_color } }
export function mapPriority(r)    { return { id: r.id, name: r.name, color: r.color } }
export function mapTag(r)         { return { id: r.id, name: r.name, color: r.color } }
export function mapCategory(r)    { return { id: r.id, name: r.name } }
export function mapQuickFilter(r) { return { id: r.id, label: r.label, filter: r.filter_key } }
export function mapColorRule(r)   { return { id: r.id, type: r.rule_type, value: r.value, bg: r.bg_color, text: r.text_color } }
export function mapColumn(r)      { return { id: r.col_id, label: r.label, visible: r.visible } }

// ── Visibility / permission ─────────────────────────────
export function canSeeTask(task, currentUser, taskShares) {
  if (!currentUser) return false
  if (currentUser.role === 'admin') return true
  if (task.created_by === currentUser.id) return true
  if (task.assignee   === currentUser.id) return true
  if ((taskShares[task.id] || []).includes(currentUser.id)) return true
  return false
}

export function canEditTask(task, currentUser) {
  if (!currentUser) return false
  if (currentUser.role === 'readonly') return false
  if (currentUser.role === 'admin') return true
  return task.created_by === currentUser.id
}

// ── Demo seed data ──────────────────────────────────────
export function seedDemoTasks() {
  const t = todayStr(), y = daysAgo(1), tm = daysAhead(1), nw = daysAhead(7)
  return [
    { id:'tk1', title:'Design new dashboard layout',   desc:'Create wireframes',      priority:'High',   status:'In Progress', category:'Work',    assignee:'u2', tags:['frontend','feature'], startdate:y,  duedate:tm, created:y, created_by:'u1', sort_order:1000 },
    { id:'tk2', title:'Fix login bug on Safari',       desc:'OAuth callback fails',   priority:'Urgent', status:'To Do',       category:'Work',    assignee:'u3', tags:['bug','frontend'],     startdate:t,  duedate:t,  created:t, created_by:'u1', sort_order:2000 },
    { id:'tk3', title:'Write Q3 financial report',     desc:'Compile Q3 figures',     priority:'Medium', status:'To Do',       category:'Finance', assignee:'u1', tags:[],                     startdate:t,  duedate:nw, created:t, created_by:'u1', sort_order:3000 },
    { id:'tk4', title:'API performance optimization',  desc:'Reduce p99 latency',     priority:'High',   status:'In Review',   category:'Work',    assignee:'u3', tags:['backend'],            startdate:y,  duedate:nw, created:y, created_by:'u2', sort_order:4000 },
    { id:'tk5', title:'Update dependencies',           desc:'npm audit',              priority:'Medium', status:'Done',        category:'Work',    assignee:'u2', tags:['backend'],            startdate:y,  duedate:y,  created:y, created_by:'u2', sort_order:5000 },
  ]
}

export const DEMO_USERS = [
  { id:'u1', email:'ankurgupta@ivp.in', display_name:'Ankur Gupta', name:'Ankur Gupta', initials:'AG', avatar_color:'#404789', color:'#404789', role:'admin',    is_active:true },
  { id:'u2', email:'alice@ivp.in',      display_name:'Alice Johnson',name:'Alice Johnson',initials:'AJ', avatar_color:'#1565c0', color:'#1565c0', role:'edit',  is_active:true },
  { id:'u3', email:'bob@ivp.in',        display_name:'Bob Smith',   name:'Bob Smith',   initials:'BS', avatar_color:'#e65100', color:'#e65100', role:'edit',    is_active:true },
]

export const DEFAULT_CONFIG = {
  statuses:     [
    {id:'s1',name:'To Do',color:'#404789',textColor:'#fff'},
    {id:'s2',name:'In Progress',color:'#e8a025',textColor:'#fff'},
    {id:'s3',name:'In Review',color:'#2278cf',textColor:'#fff'},
    {id:'s4',name:'Done',color:'#4caf50',textColor:'#fff'},
    {id:'s5',name:'Blocked',color:'#d32f2f',textColor:'#fff'},
  ],
  priorities:   [
    {id:'p1',name:'Urgent',color:'#c62828'},
    {id:'p2',name:'High',  color:'#e65100'},
    {id:'p3',name:'Medium',color:'#1565c0'},
    {id:'p4',name:'Low',   color:'#558b2f'},
  ],
  tags: [
    {id:'t1',name:'frontend',color:'#5259b3'},
    {id:'t2',name:'backend', color:'#e65100'},
    {id:'t3',name:'bug',     color:'#c62828'},
    {id:'t4',name:'feature', color:'#1565c0'},
  ],
  categories:   [{id:'c1',name:'Work'},{id:'c2',name:'Personal'},{id:'c3',name:'Finance'},{id:'c4',name:'Health'}],
  quickFilters: [
    {id:'qf1',label:'All',          filter:'all'},
    {id:'qf2',label:'🔥 Urgent',    filter:'urgent'},
    {id:'qf3',label:'📅 Due Today', filter:'today'},
    {id:'qf4',label:'📆 This Week', filter:'week'},
    {id:'qf5',label:'⚠ Overdue',   filter:'overdue'},
    {id:'qf6',label:'✅ Completed', filter:'completed'},
  ],
  columns: [
    {id:'draghandle',label:'',           visible:true},
    {id:'colorbar',  label:'',           visible:true},
    {id:'title',     label:'Title',      visible:true},
    {id:'priority',  label:'Priority',   visible:true},
    {id:'status',    label:'Status',     visible:true},
    {id:'category',  label:'Category',   visible:true},
    {id:'assignee',  label:'Assignee',   visible:true},
    {id:'tags',      label:'Tags',       visible:true},
    {id:'startdate', label:'Start Date', visible:true},
    {id:'duedate',   label:'Due Date',   visible:true},
    {id:'desc',      label:'Description',visible:false},
    {id:'shared',    label:'Shared',     visible:true},
    {id:'actions',   label:'Actions',    visible:true},
  ],
  colorRules: [
    {id:'cr1',type:'status',  value:'Blocked',bg:'#fff5f5',text:'#c62828'},
    {id:'cr2',type:'priority',value:'Urgent', bg:'#fff8f0',text:'#c62828'},
    {id:'cr3',type:'tag',     value:'bug',    bg:'#fff8f0',text:'#c62828'},
  ],
}
