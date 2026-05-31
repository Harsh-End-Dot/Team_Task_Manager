from sqlalchemy.sql.elements import ColumnElement


def not_deleted(model) -> ColumnElement[bool]:
    """Soft-delete guard: a row is active when deleted_at IS NULL.

    Reused by every query that reads soft-deletable models (Project, and Task
    in Phase 6) so the ``deleted_at IS NULL`` filter is never forgotten.
    """
    return model.deleted_at.is_(None)
