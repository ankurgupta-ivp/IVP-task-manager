// src/lib/AppContext.jsx
import { createContext, useContext, useReducer, useCallback } from 'react'
import { DEFAULT_CONFIG } from './utils'

const AppContext = createContext(null)

// ── localStorage helpers ────────────────────────────────────
const LS_KEY = 'ivp_ui_prefs'

function loadPrefs() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function savePrefs(prefs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)) } catch {}
}

function mergePrefsIntoConfig(config, prefs) {
  if (!prefs.columns) return config
  // Merge saved visibility into default columns, preserving any new columns added later
  const saved = prefs.columns
  return {
    ...config,
    columns: config.columns.map(col => {
      const savedCol = saved.find(s => s.id === col.id)
      return savedCol ? { ...col, visible: savedCol.visible } : col
    }),
  }
}

// ── Initial state ───────────────────────────────────────────
const prefs = loadPrefs()

const initialState = {
  // auth
  currentUser:      null,
  sessionToken:     null,
  dbConnected:      false,
  // data
  tasks:            [],
  taskShares:       {},
  appUsers:         [],
  // config — merge saved column visibility on startup
  config:           mergePrefsIntoConfig(DEFAULT_CONFIG, prefs),
  // ui — restore persisted preferences
  hideCompleted:    prefs.hideCompleted ?? false,
  colWidths:        prefs.colWidths ?? {},
  navFilter:        'all',
  activeQuickFilter: null,
  view:             'tasks',
}

// ── Reducer ─────────────────────────────────────────────────
function reducer(state, action) {
  let next
  switch (action.type) {
    case 'SET_DB_CONNECTED':   return { ...state, dbConnected: action.payload }
    case 'SET_USER':           return { ...state, currentUser: action.payload.user, sessionToken: action.payload.token }
    case 'LOGOUT':             return { ...state, currentUser: null, sessionToken: null, tasks: [], taskShares: {}, appUsers: [] }
    case 'BOOT_DATA': {
      // After boot, re-apply saved column prefs on top of DB-loaded columns
      const p = loadPrefs()
      const bootConfig = action.payload.config
        ? mergePrefsIntoConfig(action.payload.config, p)
        : state.config
      return { ...state, ...action.payload, config: bootConfig }
    }
    case 'SET_TASKS':          return { ...state, tasks: action.payload }
    case 'UPSERT_TASK': {
      const exists = state.tasks.find(t => t.id === action.payload.id)
      return { ...state, tasks: exists
        ? state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
        : [action.payload, ...state.tasks]
      }
    }
    case 'DELETE_TASK': {
      const shares = { ...state.taskShares }; delete shares[action.payload]
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload), taskShares: shares }
    }
    case 'SET_SHARES':         return { ...state, taskShares: { ...state.taskShares, [action.taskId]: action.payload } }
    case 'SET_APP_USERS':      return { ...state, appUsers: action.payload }
    case 'UPSERT_APP_USER': {
      const exists = state.appUsers.find(u => u.id === action.payload.id)
      return { ...state, appUsers: exists
        ? state.appUsers.map(u => u.id === action.payload.id ? action.payload : u)
        : [...state.appUsers, action.payload]
      }
    }
    case 'SET_CONFIG': {
      next = { ...state, config: { ...state.config, ...action.payload } }
      // Persist column visibility whenever columns change
      if (action.payload.columns) {
        const p = loadPrefs()
        savePrefs({ ...p, columns: action.payload.columns.map(c => ({ id: c.id, visible: c.visible })) })
      }
      return next
    }
    case 'SET_HIDE_COMPLETED': {
      const p = loadPrefs()
      savePrefs({ ...p, hideCompleted: action.payload })
      return { ...state, hideCompleted: action.payload }
    }
    case 'SET_COL_WIDTHS': {
      const p = loadPrefs()
      savePrefs({ ...p, colWidths: action.payload })
      return { ...state, colWidths: action.payload }
    }
    case 'SET_NAV_FILTER':     return { ...state, navFilter: action.payload }
    case 'SET_QUICK_FILTER':   return { ...state, activeQuickFilter: action.payload }
    case 'SET_VIEW':           return { ...state, view: action.payload }
    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const act = useCallback((type, payload) => dispatch({ type, payload }), [])
  return <AppContext.Provider value={{ state, dispatch, act }}>{children}</AppContext.Provider>
}

export function useApp() { return useContext(AppContext) }
