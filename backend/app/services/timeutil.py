"""One safe way to read the timestamps stored in the database."""
from datetime import datetime, timezone


def parse_ts(value):
    try:
        d = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)