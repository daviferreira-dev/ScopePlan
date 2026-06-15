from datetime import datetime, timezone


def utc_iso(dt: datetime | None) -> str | None:
    """Return ISO-8601 string with explicit +00:00 offset.

    SQLite drops timezone info on round-trip, producing naive datetimes.
    Without the offset, JavaScript treats the string as local time instead of UTC.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()
