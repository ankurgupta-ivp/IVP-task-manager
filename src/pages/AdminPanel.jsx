// src/pages/AdminPanel.jsx
import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { sb, isConfigured } from '../lib/supabase'
import { mapAppUser } from '../lib/utils'
import { BtnPrimary, BtnGhost, BtnDanger, Field, Input, Select, Modal,
         RoleBadge, Icon, SectionHeading, toast } from '../components/UI'

const CONFIG_TABLE = {
  statuses: 'config_statuses', priorities: 'config_priorities',
  tags: 'config_tags', categories: 'config_categories',
  quickFilters: 'config_quick_filters', colorRules: 'config_color_rules',
}

const TABS = ['👥 Users','Statuses','Priorities','Tags','Categories','Quick Filters','Columns','Color Rules']

export default function AdminPanel() {
  const { state, dispatch } = useApp()
  const { config, appUsers } = state
  const [tab, setTab] = useState(0)

  return (
    <div style={{ overflowY: 'auto', padding: 20, flex: 1 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ivp-heading)', marginBottom: 16 }}>⚙ Admin Configuration Panel</div>
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', maxWidth: 920 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ivp-border)', overflowX: 'auto' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', background: 'none', fontFamily: 'var(--ivp-font)',
                border: 'none', borderBottom: `2px solid ${tab === i ? 'var(--ivp-primary)' : 'transparent'}`,
                color: tab === i ? 'var(--ivp-primary)' : '#666', fontWeight: tab === i ? 500 : 400, whiteSpace: 'nowrap' }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ padding: 20, minHeight: 340 }}>
          {tab === 0 && <UsersTab />}
          {tab === 1 && <ConfigTab configKey="statuses" label="Statuses" showColor showTextColor />}
          {tab === 2 && <ConfigTab configKey="priorities" label="Priorities" showColor />}
          {tab === 3 && <ConfigTab configKey="tags" label="Tags" showColor />}
          {tab === 4 && <ConfigTab configKey="categories" label="Categories" />}
          {tab === 5 && <QuickFiltersTab />}
          {tab === 6 && <ColumnsTab />}
          {tab === 7 && <ColorRulesTab />}
        </div>
      </div>
    </div>
  )
}

/* ─── Users tab ─────────────────────────────────────── */
function UsersTab() {
  const { state, dispatch } = useApp()
  const { appUsers } = state
  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState('')
  const [inits,  setInits]  = useState('')
  const [role,   setRole]   = useState('edit')
  const [pw,     setPw]     = useState('')
  const [color,  setColor]  = useState('#404789')
  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)

  async function addUser() {
    if (!name.trim() || !email.trim()) { toast('Name and email required','error'); return }
    if (pw.length < 8) { toast('Password min 8 chars','error'); return }
    const i = (inits || name.split(' ').map(w=>w[0]).join('')).toUpperCase().slice(0,2)
    if (appUsers.find(u => u.email === email.toLowerCase())) { toast('Email already exists','error'); return }
    let newUser = { id:'u'+Date.now(), email:email.toLowerCase(), display_name:name, name, initials:i, avatar_color:color, color, role, is_active:true }
    if (isConfigured()) {
      try {
        const rows = await sb.insert('app_users', { email:email.toLowerCase(), display_name:name, initials:i, avatar_color:color, role, password_hash:'PLACEHOLDER' })
        if (rows?.[0]) { newUser.id = rows[0].id; await sb.rpc('app_set_password', { p_user_id:rows[0].id, p_new_password:pw }) }
      } catch(e) { toast('Failed: '+e.message,'error'); return }
    }
    dispatch({ type:'UPSERT_APP_USER', payload:newUser })
    setName('');setEmail('');setInits('');setPw('')
    toast(`User ${name} added`,'success')
  }

  async function toggleActive(u) {
    const next = !(u.is_active !== false)
    if (isConfigured()) { try { await sb.update('app_users', u.id, { is_active:next }) } catch(e) { toast('Failed','error'); return } }
    dispatch({ type:'UPSERT_APP_USER', payload:{ ...u, is_active:next } })
    toast(`User ${next?'activated':'deactivated'}`,'info')
  }

  async function resetPw(u) {
    const p = prompt(`New password for ${u.display_name} (min 8):`)
    if (!p || p.length < 8) { toast('Password too short','error'); return }
    if (!isConfigured()) { toast('Requires Supabase connection','error'); return }
    try { await sb.rpc('app_set_password',{p_user_id:u.id,p_new_password:p}); toast('Password reset','success') }
    catch(e) { toast('Failed: '+e.message,'error') }
  }

  return (
    <>
      <div style={{ fontSize:13,fontWeight:500,color:'#555',marginBottom:12 }}>
        User Management <span style={{ fontSize:12,color:'#999',fontWeight:400 }}>— {appUsers.length} users</span>
      </div>
      <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13,marginBottom:24 }}>
        <thead>
          <tr style={{ background:'#f5f5f5' }}>
            {['User','Email','Role','Status','Actions'].map(h=>(
              <th key={h} style={{ padding:'8px 12px',textAlign:'left',fontWeight:500,color:'#444',borderBottom:'1px solid #ddd' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {appUsers.map(u => (
            <tr key={u.id} onMouseEnter={e=>e.currentTarget.style.background='#f9f9ff'} onMouseLeave={e=>e.currentTarget.style.background=''}>
              <td style={{ padding:'8px 12px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <div style={{ width:26,height:26,borderRadius:'50%',background:u.avatar_color||'#404789',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' }}>{u.initials}</div>
                  <span style={{ fontWeight:500 }}>{u.display_name}</span>
                </div>
              </td>
              <td style={{ padding:'8px 12px',color:'#666' }}>{u.email}</td>
              <td style={{ padding:'8px 12px' }}><RoleBadge role={u.role} /></td>
              <td style={{ padding:'8px 12px' }}>
                <span style={{ width:8,height:8,borderRadius:'50%',display:'inline-block',marginRight:6,background:(u.is_active!==false)?'#4caf50':'#ccc' }}/>
                {(u.is_active!==false)?'Active':'Inactive'}
              </td>
              <td style={{ padding:'8px 12px' }}>
                <div style={{ display:'flex',gap:4 }}>
                  <button onClick={() => { setEditUser(u); setEditOpen(true) }}
                    style={{ border:'1px solid #ccc',background:'none',borderRadius:3,padding:'2px 8px',fontSize:11,cursor:'pointer' }}>Edit</button>
                  {u.email !== 'ankurgupta@ivp.in' && (
                    <button onClick={() => toggleActive(u)}
                      style={{ border:'1px solid #ccc',background:'none',borderRadius:3,padding:'2px 8px',fontSize:11,cursor:'pointer',color:(u.is_active!==false)?'#d32f2f':'#4caf50' }}>
                      {(u.is_active!==false)?'Deactivate':'Activate'}
                    </button>
                  )}
                  <button onClick={() => resetPw(u)}
                    style={{ border:'1px solid #ccc',background:'none',borderRadius:3,padding:'2px 8px',fontSize:11,cursor:'pointer' }}>Reset PW</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize:13,fontWeight:500,color:'#555',marginBottom:10 }}>Add New User</div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',maxWidth:600,marginBottom:14 }}>
        <Field label="Full Name *"><Input value={name} onChange={e=>setName(e.target.value)} placeholder="John Smith" /></Field>
        <Field label="Email *"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="john@company.com" /></Field>
        <Field label="Initials"><Input value={inits} onChange={e=>setInits(e.target.value)} placeholder="JS" maxLength={3} /></Field>
        <Field label="Role">
          <Select value={role} onChange={e=>setRole(e.target.value)}>
            <option value="edit">Edit</option><option value="readonly">Read-Only</option><option value="admin">Admin</option>
          </Select>
        </Field>
        <Field label="Password *"><Input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Min 8 characters" /></Field>
        <Field label="Avatar Color">
          <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{ height:36,border:'1px solid #ccc',borderRadius:4,padding:2,width:'100%',cursor:'pointer' }} />
        </Field>
      </div>
      <BtnPrimary onClick={addUser}><Icon name="person_add" size={15} /> Add User</BtnPrimary>
      <div style={{ marginTop:16,padding:'10px 14px',background:'#e8f5e9',borderRadius:4,borderLeft:'3px solid #4caf50',fontSize:12,color:'#2e7d32' }}>
        <strong>Roles:</strong> Admin — full access + admin panel &nbsp;|&nbsp; Edit — create/edit own tasks &nbsp;|&nbsp; Read-Only — view only
      </div>

      {/* Edit user modal */}
      {editUser && (
        <EditUserModal open={editOpen} onClose={() => setEditOpen(false)} user={editUser} />
      )}
    </>
  )
}

function EditUserModal({ open, onClose, user }) {
  const { dispatch } = useApp()
  const [name,  setName]  = useState(user.display_name)
  const [inits, setInits] = useState(user.initials)
  const [role,  setRole]  = useState(user.role)
  const [color, setColor] = useState(user.avatar_color || '#404789')

  async function save() {
    const updated = { ...user, display_name: name, name, initials: inits.toUpperCase().slice(0,2), role, avatar_color: color, color }
    if (isConfigured()) {
      try { await sb.update('app_users', user.id, { display_name:name, initials:updated.initials, role, avatar_color:color }) }
      catch(e) { toast('Failed: '+e.message,'error'); return }
    }
    dispatch({ type:'UPSERT_APP_USER', payload: updated })
    onClose(); toast('User updated','success')
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit — ${user.display_name}`} width={420}
      footer={<><BtnPrimary onClick={save}>Save</BtnPrimary><BtnGhost onClick={onClose}>Cancel</BtnGhost></>}>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 16px' }}>
        <Field label="Display Name"><Input value={name} onChange={e=>setName(e.target.value)} /></Field>
        <Field label="Initials"><Input value={inits} onChange={e=>setInits(e.target.value)} maxLength={3} /></Field>
        <Field label="Role">
          <Select value={role} onChange={e=>setRole(e.target.value)} disabled={user.email==='ankurgupta@ivp.in'}>
            <option value="edit">Edit</option><option value="readonly">Read-Only</option><option value="admin">Admin</option>
          </Select>
        </Field>
        <Field label="Avatar Color">
          <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{ height:36,border:'1px solid #ccc',borderRadius:4,padding:2,width:'100%',cursor:'pointer' }} />
        </Field>
      </div>
    </Modal>
  )
}

/* ─── Generic config list tab ───────────────────────── */
function ConfigTab({ configKey, label, showColor, showTextColor }) {
  const { state, dispatch } = useApp()
  const items = state.config[configKey] || []
  const [newName,  setNewName]  = useState('')
  const [newColor, setNewColor] = useState('#404789')

  async function add() {
    if (!newName.trim()) return
    const item = { id: configKey + Date.now(), name: newName.trim(), ...(showColor ? { color: newColor } : {}), ...(showTextColor ? { textColor: '#ffffff' } : {}) }
    if (isConfigured()) {
      const dbPayload = { name: newName.trim(), ...(showColor ? { color: newColor } : {}), ...(showTextColor ? { text_color: '#ffffff' } : {}) }
      try { const rows = await sb.insert(CONFIG_TABLE[configKey], dbPayload); if (rows?.[0]) item.id = rows[0].id }
      catch(e) { toast('Save failed: '+e.message,'error'); return }
    }
    dispatch({ type:'SET_CONFIG', payload:{ [configKey]: [...items, item] } })
    setNewName(''); toast('Added','success')
  }

  async function remove(idx) {
    const item = items[idx]
    if (isConfigured() && item?.id) {
      try { await sb.delete(CONFIG_TABLE[configKey], item.id) } catch(e) { toast('Delete failed','error'); return }
    }
    dispatch({ type:'SET_CONFIG', payload:{ [configKey]: items.filter((_,i)=>i!==idx) } })
  }

  function updateColor(idx, val) {
    const next = items.map((it,i) => i===idx ? {...it,color:val} : it)
    dispatch({ type:'SET_CONFIG', payload:{ [configKey]: next } })
  }
  function updateTextColor(idx, val) {
    const next = items.map((it,i) => i===idx ? {...it,textColor:val} : it)
    dispatch({ type:'SET_CONFIG', payload:{ [configKey]: next } })
  }

  return (
    <>
      <div style={{ fontSize:13,fontWeight:500,color:'#555',marginBottom:10 }}>{label}</div>
      <div style={{ display:'flex',flexDirection:'column',gap:6,maxHeight:300,overflowY:'auto',marginBottom:12 }}>
        {items.map((item,i) => (
          <div key={item.id||i} style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 10px',border:'1px solid var(--ivp-border)',borderRadius:4 }}>
            {showColor && <input type="color" value={item.color||'#404789'} onChange={e=>updateColor(i,e.target.value)} style={{ width:24,height:24,border:'1px solid #ccc',borderRadius:3,padding:0,cursor:'pointer' }} />}
            <span style={{ flex:1,fontSize:14 }}>{item.name}</span>
            {showTextColor && item.textColor !== undefined && (
              <><span style={{ fontSize:11,color:'#999' }}>text:</span><input type="color" value={item.textColor||'#fff'} onChange={e=>updateTextColor(i,e.target.value)} style={{ width:22,height:20,border:'none',cursor:'pointer',padding:0 }} /></>
            )}
            <button onClick={() => remove(i)} style={{ background:'none',border:'none',cursor:'pointer',color:'#aaa',display:'flex' }}>
              <Icon name="delete" size={16} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:8,alignItems:'center' }}>
        {showColor && <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)} style={{ width:32,height:32,border:'1px solid #ccc',borderRadius:4,padding:0,cursor:'pointer' }} />}
        <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
          placeholder={`Add new ${label.slice(0,-1).toLowerCase()}…`}
          style={{ flex:1,border:'1px solid var(--ivp-border-input)',borderRadius:4,padding:'7px 10px',fontSize:14,fontFamily:'var(--ivp-font)',outline:'none' }} />
        <BtnPrimary onClick={add}>Add</BtnPrimary>
      </div>
    </>
  )
}

/* ─── Quick filters tab ─────────────────────────────── */
function QuickFiltersTab() {
  const { state, dispatch } = useApp()
  const { config } = state
  const [label, setLabel]   = useState('')
  const [filter, setFilter] = useState('')

  async function add() {
    if (!label.trim() || !filter.trim()) return
    const item = { id:'qf'+Date.now(), label:label.trim(), filter:filter.trim() }
    if (isConfigured()) {
      try { const rows = await sb.insert('config_quick_filters',{label:label.trim(),filter_key:filter.trim()}); if(rows?.[0]) item.id=rows[0].id }
      catch(e) { toast('Failed','error'); return }
    }
    dispatch({ type:'SET_CONFIG', payload:{ quickFilters:[...config.quickFilters, item] } })
    setLabel(''); setFilter(''); toast('Added','success')
  }

  async function remove(idx) {
    const item = config.quickFilters[idx]
    if (isConfigured() && item?.id) { try { await sb.delete('config_quick_filters',item.id) } catch { toast('Failed','error'); return } }
    dispatch({ type:'SET_CONFIG', payload:{ quickFilters: config.quickFilters.filter((_,i)=>i!==idx) } })
  }

  return (
    <>
      <div style={{ fontSize:13,fontWeight:500,color:'#555',marginBottom:10 }}>Quick Filters</div>
      <div style={{ display:'flex',flexDirection:'column',gap:6,maxHeight:280,overflowY:'auto',marginBottom:12 }}>
        {config.quickFilters.map((qf,i) => (
          <div key={qf.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 10px',border:'1px solid var(--ivp-border)',borderRadius:4 }}>
            <span style={{ flex:1,fontSize:14 }}>{qf.label}</span>
            <span style={{ fontSize:11,color:'#aaa',background:'#f0f0f0',padding:'1px 6px',borderRadius:3 }}>{qf.filter}</span>
            <button onClick={()=>remove(i)} style={{ background:'none',border:'none',cursor:'pointer',color:'#aaa',display:'flex' }}><Icon name="delete" size={16} /></button>
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
        <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Label (e.g. 🔥 Hot)"
          style={{ flex:2,minWidth:120,border:'1px solid var(--ivp-border-input)',borderRadius:4,padding:'7px 10px',fontSize:14,fontFamily:'var(--ivp-font)',outline:'none' }} />
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter key (e.g. bug)"
          style={{ flex:1,minWidth:100,border:'1px solid var(--ivp-border-input)',borderRadius:4,padding:'7px 10px',fontSize:14,fontFamily:'var(--ivp-font)',outline:'none' }} />
        <BtnPrimary onClick={add}>Add</BtnPrimary>
      </div>
      <div style={{ marginTop:10,fontSize:12,color:'#999' }}>Tag names can be used as filter keys to create tag-based quick filters.</div>
    </>
  )
}

/* ─── Columns tab ───────────────────────────────────── */
function ColumnsTab() {
  const { state, dispatch } = useApp()
  const { config } = state
  const toggleCol = id => {
    const next = config.columns.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
    dispatch({ type:'SET_CONFIG', payload:{ columns: next } })
  }
  return (
    <>
      <div style={{ fontSize:13,fontWeight:500,color:'#555',marginBottom:10 }}>Blotter Columns</div>
      <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
        {config.columns.filter(c=>c.id!=='draghandle'&&c.id!=='colorbar').map(c=>(
          <label key={c.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'6px 10px',border:'1px solid var(--ivp-border)',borderRadius:4,cursor:'pointer' }}>
            <input type="checkbox" checked={c.visible} onChange={()=>toggleCol(c.id)} style={{ accentColor:'var(--ivp-primary)',width:15,height:15 }} />
            <span style={{ fontSize:14 }}>{c.label || c.id}</span>
          </label>
        ))}
      </div>
    </>
  )
}

/* ─── Color rules tab ───────────────────────────────── */
function ColorRulesTab() {
  const { state, dispatch } = useApp()
  const { config } = state
  const [type,  setType]  = useState('status')
  const [value, setValue] = useState('')
  const [bg,    setBg]    = useState('#fff5f5')
  const [text,  setText]  = useState('#c62828')

  async function add() {
    if (!value.trim()) return
    const item = { id:'cr'+Date.now(), type, value:value.trim(), bg, text }
    if (isConfigured()) {
      try { const rows = await sb.insert('config_color_rules',{rule_type:type,value:value.trim(),bg_color:bg,text_color:text}); if(rows?.[0])item.id=rows[0].id }
      catch(e) { toast('Failed','error'); return }
    }
    dispatch({ type:'SET_CONFIG', payload:{ colorRules:[...config.colorRules, item] } })
    setValue(''); toast('Rule added','success')
  }

  async function remove(idx) {
    const item = config.colorRules[idx]
    if (isConfigured()&&item?.id) { try { await sb.delete('config_color_rules',item.id) } catch { toast('Failed','error'); return } }
    dispatch({ type:'SET_CONFIG', payload:{ colorRules: config.colorRules.filter((_,i)=>i!==idx) } })
  }

  function updateRule(idx, field, val) {
    const next = config.colorRules.map((r,i) => i===idx ? {...r,[field]:val} : r)
    dispatch({ type:'SET_CONFIG', payload:{ colorRules: next } })
  }

  return (
    <>
      <div style={{ fontSize:13,fontWeight:500,color:'#555',marginBottom:4 }}>Row Color Rules</div>
      <div style={{ fontSize:12,color:'#999',marginBottom:12 }}>Assign row highlight colors based on status, priority, or tag value</div>
      <div style={{ display:'flex',flexDirection:'column',gap:6,maxHeight:250,overflowY:'auto',marginBottom:12 }}>
        {config.colorRules.map((r,i) => (
          <div key={r.id||i} style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 10px',border:'1px solid var(--ivp-border)',borderRadius:4,background:r.bg,borderLeft:`4px solid ${r.text}` }}>
            <span style={{ fontSize:12,color:'#555',width:60 }}>{r.type}</span>
            <span style={{ flex:1,fontSize:14 }}>{r.value}</span>
            <span style={{ fontSize:11 }}>BG:</span><input type="color" value={r.bg} onChange={e=>updateRule(i,'bg',e.target.value)} style={{ width:26,height:20,border:'none',padding:0,cursor:'pointer' }} />
            <span style={{ fontSize:11 }}>Text:</span><input type="color" value={r.text} onChange={e=>updateRule(i,'text',e.target.value)} style={{ width:26,height:20,border:'none',padding:0,cursor:'pointer' }} />
            <button onClick={()=>remove(i)} style={{ background:'none',border:'none',cursor:'pointer',color:'#aaa',display:'flex' }}><Icon name="delete" size={16} /></button>
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:8,flexWrap:'wrap',alignItems:'center' }}>
        <Select value={type} onChange={e=>setType(e.target.value)} style={{ width:90,padding:'6px 8px' }}>
          <option>status</option><option>priority</option><option>tag</option>
        </Select>
        <input value={value} onChange={e=>setValue(e.target.value)} placeholder="Value (e.g. Blocked)"
          style={{ flex:2,border:'1px solid var(--ivp-border-input)',borderRadius:4,padding:'7px 10px',fontSize:14,fontFamily:'var(--ivp-font)',outline:'none' }} />
        <label style={{ fontSize:12,display:'flex',alignItems:'center',gap:4 }}>BG<input type="color" value={bg} onChange={e=>setBg(e.target.value)} style={{ width:28,height:26,border:'none',padding:0 }} /></label>
        <label style={{ fontSize:12,display:'flex',alignItems:'center',gap:4 }}>Text<input type="color" value={text} onChange={e=>setText(e.target.value)} style={{ width:28,height:26,border:'none',padding:0 }} /></label>
        <BtnPrimary onClick={add}>Add Rule</BtnPrimary>
      </div>
    </>
  )
}
