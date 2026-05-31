// The three Kanban columns, left to right.
export const COLUMN_ORDER = ['TODO', 'IN_PROGRESS', 'DONE']

/** Group a flat task list into { TODO, IN_PROGRESS, DONE }, each sorted by position. */
export function groupByStatus(tasks) {
  const cols = { TODO: [], IN_PROGRESS: [], DONE: [] }
  for (const t of tasks) (cols[t.status] ?? cols.TODO).push(t)
  for (const key of COLUMN_ORDER) {
    cols[key].sort(
      (a, b) =>
        a.position - b.position ||
        new Date(a.created_at) - new Date(b.created_at),
    )
  }
  return cols
}

/**
 * Which column an id belongs to. `id` is either a column key (the droppable
 * container) or a task id. Returns the column key or undefined.
 */
export function findContainer(columns, id) {
  if (COLUMN_ORDER.includes(id)) return id
  return COLUMN_ORDER.find((key) => columns[key].some((t) => t.id === id))
}
