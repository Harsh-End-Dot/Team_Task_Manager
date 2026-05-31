import { api } from '@/lib/api'

// GET /projects/{pid}/tasks → TaskResponse[] (non-deleted), ordered by
// (status, position, created_at). TaskResponse includes subtasks[] and labels[].
export async function fetchTasks(projectId) {
  const { data } = await api.get(`/projects/${projectId}/tasks`)
  return data
}

// POST /projects/{pid}/tasks (admin-only) → TaskResponse (201).
// payload: { title, description?, status, priority, assignee_id?, due_date? }
export async function createTask({ projectId, payload }) {
  const { data } = await api.post(`/projects/${projectId}/tasks`, payload)
  return data
}

// PATCH /tasks/{tid}/status { status } → TaskResponse (assignee or admin).
export async function updateTaskStatus({ taskId, status }) {
  const { data } = await api.patch(`/tasks/${taskId}/status`, { status })
  return data
}

// PATCH /tasks/{tid}/reorder { position } → TaskResponse (assignee or admin).
export async function reorderTask({ taskId, position }) {
  const { data } = await api.patch(`/tasks/${taskId}/reorder`, { position })
  return data
}

// POST /tasks/{tid}/labels/{lid} → TaskResponse (201). Idempotent attach.
export async function attachLabel({ taskId, labelId }) {
  const { data } = await api.post(`/tasks/${taskId}/labels/${labelId}`)
  return data
}

// --- Phase 7 (task detail) ---

// GET /tasks/{taskId} → full TaskResponse (subtasks + labels embedded).
export async function getTask(taskId) {
  const { data } = await api.get(`/tasks/${taskId}`)
  return data
}

// PATCH /tasks/{taskId} → TaskResponse (assignee or admin).
// patch: { title?, description?, priority?, due_date? }
export async function updateTask(taskId, patch) {
  const { data } = await api.patch(`/tasks/${taskId}`, patch)
  return data
}

// PATCH /tasks/{taskId}/assign { assignee_id | null } (admin only) → TaskResponse
export async function assignTask(taskId, assigneeId) {
  const { data } = await api.patch(`/tasks/${taskId}/assign`, {
    assignee_id: assigneeId,
  })
  return data
}

// DELETE /tasks/{taskId}/labels/{labelId} → 204
export async function detachLabel({ taskId, labelId }) {
  await api.delete(`/tasks/${taskId}/labels/${labelId}`)
}

// POST /tasks/{taskId}/subtasks { title } → SubtaskResponse (201)
export async function createSubtask(taskId, title) {
  const { data } = await api.post(`/tasks/${taskId}/subtasks`, { title })
  return data
}

// PATCH /subtasks/{subtaskId} { is_done?, title? } → SubtaskResponse.
export async function updateSubtask(subtaskId, patch) {
  const { data } = await api.patch(`/subtasks/${subtaskId}`, patch)
  return data
}

// DELETE /subtasks/{subtaskId} → 204
export async function deleteSubtask(subtaskId) {
  await api.delete(`/subtasks/${subtaskId}`)
}

// GET /tasks/{taskId}/comments → CommentResponse[] (chronological)
export async function fetchComments(taskId) {
  const { data } = await api.get(`/tasks/${taskId}/comments`)
  return data
}

// POST /tasks/{taskId}/comments { body } → CommentResponse (201).
// @<email> mentions are parsed server-side; the response carries mentioned_users.
export async function createComment(taskId, body) {
  const { data } = await api.post(`/tasks/${taskId}/comments`, { body })
  return data
}

// DELETE /comments/{commentId} → 204 (author or admin)
export async function deleteComment(commentId) {
  await api.delete(`/comments/${commentId}`)
}
