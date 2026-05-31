import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { getToken } from '@/lib/api'

// Derive the WS origin from the REST base URL (http→ws, https→wss).
function wsBaseUrl() {
  const http = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
  return http.replace(/^http/i, 'ws')
}

/**
 * Live workspace updates over the backend WebSocket
 * (`/ws/workspaces/{id}?token=<jwt>`). On each broadcast it invalidates the
 * relevant TanStack Query caches so the board, dashboard, and open task detail
 * refresh with no manual reload.
 *
 * Best-effort by design: every socket interaction is guarded, a dropped socket
 * reconnects with capped exponential backoff, and a connection that can never
 * succeed (auth/forbidden close codes) stops retrying. Nothing here can throw
 * into React or break the app if the socket is down.
 */
export function useWorkspaceRealtime(workspaceId) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!workspaceId) return

    let socket = null
    let reconnectTimer = null
    let attempts = 0
    let disposed = false

    function handleEvent(msg) {
      switch (msg.type) {
        case 'task.created':
        case 'task.updated':
        case 'task.status_changed':
        case 'task.moved':
        case 'task.deleted': {
          // Board is keyed per project (['tasks', projectId]); the event may not
          // carry the project, so invalidate the whole 'tasks' space. Also the
          // dashboard aggregates and any open task detail.
          qc.invalidateQueries({ queryKey: ['tasks'] })
          qc.invalidateQueries({ queryKey: ['dashboard', workspaceId] })
          if (msg.id) qc.invalidateQueries({ queryKey: ['task', msg.id] })
          break
        }
        case 'comment.added': {
          if (msg.task_id) {
            qc.invalidateQueries({ queryKey: ['comments', msg.task_id] })
            qc.invalidateQueries({ queryKey: ['task', msg.task_id] })
          }
          break
        }
        default:
          break
      }
    }

    function scheduleReconnect() {
      if (disposed) return
      attempts += 1
      const delay = Math.min(1000 * 2 ** (attempts - 1), 15000) // 1s → 15s cap
      reconnectTimer = setTimeout(connect, delay)
    }

    function connect() {
      if (disposed) return
      const token = getToken()
      if (!token) {
        // Not authenticated yet - retry shortly; a valid token may arrive.
        scheduleReconnect()
        return
      }
      try {
        socket = new WebSocket(
          `${wsBaseUrl()}/ws/workspaces/${workspaceId}?token=${encodeURIComponent(
            token,
          )}`,
        )
      } catch {
        scheduleReconnect()
        return
      }

      socket.onopen = () => {
        attempts = 0 // reset backoff on a healthy connection
      }
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg && msg.type) handleEvent(msg)
        } catch {
          /* ignore malformed frame */
        }
      }
      socket.onclose = (e) => {
        socket = null
        if (disposed) return
        // 4401 unauthorized / 4403 forbidden: retrying won't help, so stop.
        if (e.code === 4401 || e.code === 4403) return
        scheduleReconnect()
      }
      socket.onerror = () => {
        // An error is always followed by close; close there drives reconnect.
        try {
          socket?.close()
        } catch {
          /* noop */
        }
      }
    }

    connect()

    return () => {
      disposed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (socket) {
        socket.onclose = null // intentional close - don't reconnect
        try {
          socket.close()
        } catch {
          /* noop */
        }
        socket = null
      }
    }
  }, [workspaceId, qc])
}
