// src/hooks/useBootstrap.js
import { useCallback } from 'react'
import { useApp } from '../lib/AppContext'
import { sb, isConfigured } from '../lib/supabase'
import { mapTask, mapAppUser, mapStatus, mapPriority, mapTag, mapCategory,
         mapQuickFilter, mapColorRule, mapColumn, seedDemoTasks, DEMO_USERS, DEFAULT_CONFIG } from '../lib/utils'

export function useBootstrap() {
  const { dispatch } = useApp()

  const boot = useCallback(async () => {
    if (!isConfigured()) {
      // demo mode
      const tasks = seedDemoTasks()
      const taskShares = { tk3: ['u2'] }
      dispatch({ type: 'BOOT_DATA', payload: {
        tasks, taskShares, appUsers: DEMO_USERS, config: DEFAULT_CONFIG,
      }})
      return
    }
    try {
      const [tasks, shares, users, statuses, priorities, tags, categories,
             quickFilters, colorRules, columns] = await Promise.all([
        sb.select('tasks',                { order: 'sort_order.asc' }),
        sb.select('task_shares',          {}),
        sb.select('app_users',            { is_active: 'eq.true', order: 'display_name.asc' }),
        sb.select('config_statuses',      { order: 'sort_order.asc' }),
        sb.select('config_priorities',    { order: 'sort_order.asc' }),
        sb.select('config_tags',          { order: 'name.asc' }),
        sb.select('config_categories',    { order: 'sort_order.asc' }),
        sb.select('config_quick_filters', { order: 'sort_order.asc' }),
        sb.select('config_color_rules',   { order: 'sort_order.asc' }),
        sb.select('config_columns',       { order: 'sort_order.asc' }),
      ])

      const mappedTasks = (tasks || []).map(mapTask)
      // If all sort_orders are 0, assign initial spacing
      const allZero = mappedTasks.every(t => t.sort_order === 0)
      if (allZero && mappedTasks.length) {
        mappedTasks.forEach((t, i) => { t.sort_order = (i + 1) * 1000 })
        mappedTasks.forEach(t => sb.update('tasks', t.id, { sort_order: t.sort_order }).catch(() => {}))
      }

      const taskShares = {}
      ;(shares || []).forEach(s => {
        if (!taskShares[s.task_id]) taskShares[s.task_id] = []
        taskShares[s.task_id].push(s.shared_with_user_id)
      })

      const appUsers  = (users || []).map(mapAppUser)
      const config = {
        statuses:     (statuses     || []).map(mapStatus),
        priorities:   (priorities   || []).map(mapPriority),
        tags:         (tags         || []).map(mapTag),
        categories:   (categories   || []).map(mapCategory),
        quickFilters: (quickFilters || []).map(mapQuickFilter),
        colorRules:   (colorRules   || []).map(mapColorRule),
        columns:      columns?.length ? columns.map(mapColumn) : DEFAULT_CONFIG.columns,
        members:      appUsers,
      }

      dispatch({ type: 'BOOT_DATA', payload: { tasks: mappedTasks, taskShares, appUsers, config }})
    } catch (e) {
      console.error('Boot error', e)
      const tasks = seedDemoTasks()
      dispatch({ type: 'BOOT_DATA', payload: { tasks, taskShares: { tk3: ['u2'] }, appUsers: DEMO_USERS, config: DEFAULT_CONFIG }})
    }
  }, [dispatch])

  return boot
}
