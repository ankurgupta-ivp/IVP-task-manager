// src/lib/AppContext.jsx
import { createContext, useContext, useReducer, useCallback } from 'react'
import { DEFAULT_CONFIG } from './utils'

const AppContext = createContext(null)

const initialState = {
  // auth
  currentUser:   null,
  sessionToken:  null,
  dbConnected:   false,
  // data
  tasks:         [],
  taskShares:    {},   // taskId → userId[]
  appUsers:      [],
  // config
  config:        DEFAULT_CONFIG,
  // ui
  hideCompleted: false,
  navFilter:     'all',
  activeQuickFilter: null,
  view:          'tasks',   // 'tasks' | 'admin'
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DB_CONNECTED':   return { ...state, dbConnected: action.payload }
    case 'SET_USER':           return { ...state, currentUser: action.payload.user, sessionToken: action.payload.token }
    case 'LOGOUT':             return { ...state, currentUser: null, sessionToken: null, tasks: [], taskShares: {}, appUsers: [] }
    case 'BOOT_DATA':          return { ...state, ...action.payload }
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
    case 'SET_CONFIG':         return { ...state, config: { ...state.config, ...action.payload } }
    case 'SET_HIDE_COMPLETED': return { ...state, hideCompleted: action.payload }
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
