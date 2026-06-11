"""Token blocklist stored in the database — survives restarts and shared across workers."""
from datetime import datetime, timezone
from app import db


class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    @staticmethod
    def revoke(jti, expires_at):
        """Add a JTI to the blocklist. expires_at can be a UNIX timestamp or datetime.
        Relies on unique constraint to handle duplicates.
        Uses a savepoint so duplicate-JTI rollback does not nuke the caller's session."""
        if isinstance(expires_at, (int, float)):
            expires_at = datetime.fromtimestamp(expires_at, tz=timezone.utc)
        # Use savepoint so rollback only affects this INSERT, not the caller's transaction
        savepoint = db.session.begin_nested()
        try:
            entry = TokenBlocklist(jti=jti, expires_at=expires_at)
            db.session.add(entry)
            savepoint.commit()
            return entry
        except Exception:
            savepoint.rollback()
            return TokenBlocklist.query.filter_by(jti=jti).first()

    @staticmethod
    def is_revoked(jti):
        """Check if a JTI is in the blocklist."""
        return TokenBlocklist.query.filter_by(jti=jti).first() is not None
